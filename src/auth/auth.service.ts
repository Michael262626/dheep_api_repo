import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { SmsService } from 'src/shared/sms.service';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 1 * 60 * 60 * 1000; // 1 hour

interface OtpStore {
  [phone: string]: { otp: string; expiresAt: number; deviceId: string };
}

interface PasswordResetStore {
  [email: string]: { token: string; expiresAt: number };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private passwordResetStore: PasswordResetStore = {};

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService, // <-- INJECT THE SMS SERVICE
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
  ) {}

  async requestOtp(phone: string, deviceId: string): Promise<{ success: boolean; message?: string }> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    // update user info
    await this.usersService.updateByPhone(user.phone, { otp, expiresAt, deviceId });

    const message = `Your ZawadiTap OTP is: ${otp}`;

    try {
      // await this.smsService.sendSms(phone, message);
      return { success: true, message: 'OTP sent via SMS' };
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phone} after all fallbacks.`, error.message);
      // Fallback to console log for development/critical failure
      this.logger.log(`CONSOLE FALLBACK - OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP sent (console fallback due to provider failure)' };
    }
  }

  async verifyOtp(phone: string, deviceId: string, otp: string): Promise<{ token: string }> {
    let user: any = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    if (Date.now() > user.expiresAt) {
      throw new UnauthorizedException('OTP expired');
    }
    // Check device lock
    if (user) {
      if (user.deviceId && user.deviceId !== deviceId) {
        throw new UnauthorizedException('Account is locked to another device');
      }
      // Update deviceId if not set
      if (!user.deviceId) {
        await this.usersService.update(user._id.toString(), { deviceId });
      }
    } else {
      // Create new user
      user = await this.usersService.create({ phone, deviceId, isVerified: true }) as UserDocument;
    }
    const payload = { sub: user._id, phone: user.phone, role: 'user' };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  async registerAdmin(dto: { 
    name: string; 
    country: string;
    adminEmail: string; 
    password: string;
    contactFirstName: string;
    contactLastName: string;
    contactMobile: string;
  }) {
    const existing = await this.orgModel.findOne({ 
      $or: [{ name: dto.name }, { adminEmail: dto.adminEmail }] 
    });
    if (existing) throw new ConflictException('Organization or email already exists');
    
    const hash = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    const org = new this.orgModel({
      name: dto.name,
      country: dto.country,
      adminEmail: dto.adminEmail,
      adminPasswordHash: hash,
      contactFirstName: dto.contactFirstName,
      contactLastName: dto.contactLastName,
      contactMobile: dto.contactMobile,
      emailVerificationToken,
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
    });
    await org.save();
    
    // TODO: Send email verification email
    return { success: true, message: 'Organization registered. Please check your email to verify your account.' };
  }

  async loginAdmin(dto: { adminEmail: string; password: string; mfaCode?: string }) {
    const org = await this.orgModel.findOne({ adminEmail: dto.adminEmail });
    if (!org) throw new UnauthorizedException('Invalid credentials');
    
    if (!org.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    
    const valid = await bcrypt.compare(dto.password, org.adminPasswordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    
    // Check MFA if enabled
    if (org.mfaEnabled) {
      if (!dto.mfaCode) {
        throw new UnauthorizedException('MFA code required');
      }
      // TODO: Implement MFA verification logic
      // const isValidMfa = this.verifyMfaCode(org.mfaSecret, dto.mfaCode);
      // if (!isValidMfa) throw new UnauthorizedException('Invalid MFA code');
    }
    
    const payload = { sub: org._id, adminEmail: org.adminEmail, role: 'admin' };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const org = await this.orgModel.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
    
    if (!org) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    
    org.emailVerified = true;
    org.emailVerificationToken = undefined;
    org.emailVerificationExpires = undefined;
    await org.save();
    
    return { success: true };
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
    const org = await this.orgModel.findOne({ adminEmail: email });
    if (!org) {
      // Don't reveal if email exists or not
      return { success: true };
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + PASSWORD_RESET_EXPIRY_MS;
    
    this.passwordResetStore[email] = { token: resetToken, expiresAt };
    
    // TODO: Send password reset email with resetToken
    return { success: true, message: 'Password reset instructions sent to your email' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const email = Object.keys(this.passwordResetStore).find(
      key => this.passwordResetStore[key].token === token
    );
    
    if (!email) {
      throw new BadRequestException('Invalid reset token');
    }
    
    const resetRecord = this.passwordResetStore[email];
    if (Date.now() > resetRecord.expiresAt) {
      delete this.passwordResetStore[email];
      throw new BadRequestException('Reset token expired');
    }
    
    const org = await this.orgModel.findOne({ adminEmail: email });
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    
    const hash = await bcrypt.hash(newPassword, 10);
    org.adminPasswordHash = hash;
    await org.save();
    
    delete this.passwordResetStore[email];
    return { success: true };
  }

  async setupMfa(orgId: string): Promise<{ qrCode: string; secret: string }> {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new BadRequestException('Organization not found');
    
    const secret = crypto.randomBytes(20).toString('base64');
    const qrCodeData = `otpauth://totp/ZawadiTap:${org.adminEmail}?secret=${secret}&issuer=ZawadiTap`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    
    org.mfaSecret = secret;
    await org.save();
    
    return { qrCode, secret };
  }

  async enableMfa(orgId: string, mfaCode: string): Promise<{ success: boolean }> {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new BadRequestException('Organization not found');
    
    if (!org.mfaSecret) {
      throw new BadRequestException('MFA not set up. Please set up MFA first.');
    }
    
    // TODO: Implement MFA verification logic
    // const isValidMfa = this.verifyMfaCode(org.mfaSecret, mfaCode);
    // if (!isValidMfa) throw new UnauthorizedException('Invalid MFA code');
    
    org.mfaEnabled = true;
    await org.save();
    
    return { success: true };
  }

  async disableMfa(orgId: string, mfaCode: string): Promise<{ success: boolean }> {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new BadRequestException('Organization not found');
    
    if (!org.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }
    
    // TODO: Implement MFA verification logic
    // const isValidMfa = this.verifyMfaCode(org.mfaSecret, mfaCode);
    // if (!isValidMfa) throw new UnauthorizedException('Invalid MFA code');
    
    org.mfaEnabled = false;
    org.mfaSecret = undefined;
    await org.save();
    
    return { success: true };
  }
}