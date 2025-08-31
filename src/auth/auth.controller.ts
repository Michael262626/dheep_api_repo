import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for phone verification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+1234567890', description: 'Phone number' },
        deviceId: { type: 'string', example: 'device123', description: 'Unique device identifier' },
      },
      required: ['phone', 'deviceId'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  async requestOtp(@Body() body: { phone: string; deviceId: string }) {
    return this.authService.requestOtp(body.phone, body.deviceId);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and authenticate user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+1234567890', description: 'Phone number' },
        deviceId: { type: 'string', example: 'device123', description: 'Device identifier' },
        otp: { type: 'string', example: '123456', description: '6-digit OTP code' },
      },
      required: ['phone', 'deviceId', 'otp'],
    },
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async verifyOtp(@Body() body: { phone: string; deviceId: string; otp: string }) {
    return this.authService.verifyOtp(body.phone, body.deviceId, body.otp);
  }

  @Post('admin/register')
  @ApiOperation({ summary: 'Register a new admin organization' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Organization', description: 'Organization name' },
        country: { type: 'string', example: 'US', description: 'Country code' },
        adminEmail: { type: 'string', example: 'admin@org.com', description: 'Admin email address' },
        password: { type: 'string', example: 'password123', description: 'Admin password' },
        contactFirstName: { type: 'string', example: 'John', description: 'Contact person first name' },
        contactLastName: { type: 'string', example: 'Doe', description: 'Contact person last name' },
        contactMobile: { type: 'string', example: '+1234567890', description: 'Contact mobile number' },
      },
      required: ['name', 'country', 'adminEmail', 'password', 'contactFirstName', 'contactLastName', 'contactMobile'],
    },
  })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async registerAdmin(@Body() body: { 
    name: string; 
    country: string;
    adminEmail: string; 
    password: string;
    contactFirstName: string;
    contactLastName: string;
    contactMobile: string;
  }) {
    return this.authService.registerAdmin(body);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Authenticate admin user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminEmail: { type: 'string', example: 'admin@org.com', description: 'Admin email' },
        password: { type: 'string', example: 'password123', description: 'Admin password' },
        mfaCode: { type: 'string', example: '123456', description: 'MFA code if MFA is enabled' },
      },
      required: ['adminEmail', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginAdmin(@Body() body: { adminEmail: string; password: string; mfaCode?: string }) {
    return this.authService.loginAdmin(body);
  }

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email address using token' })
  @ApiParam({ name: 'token', description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@org.com', description: 'Admin email address' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'reset-token-123', description: 'Password reset token' },
        newPassword: { type: 'string', example: 'newpassword123', description: 'New password' },
      },
      required: ['token', 'newPassword'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA for admin account' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setupMfa(@Req() req) {
    const orgId = req.user?.userId;
    return this.authService.setupMfa(orgId);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable MFA after setup' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mfaCode: { type: 'string', example: '123456', description: '6-digit MFA code' },
      },
      required: ['mfaCode'],
    },
  })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MFA code' })
  async enableMfa(@Body() body: { mfaCode: string }, @Req() req) {
    const orgId = req.user?.userId;
    return this.authService.enableMfa(orgId, body.mfaCode);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mfaCode: { type: 'string', example: '123456', description: '6-digit MFA code' },
      },
      required: ['mfaCode'],
    },
  })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MFA code' })
  async disableMfa(@Body() body: { mfaCode: string }, @Req() req) {
    const orgId = req.user?.userId;
    return this.authService.disableMfa(orgId, body.mfaCode);
  }
}