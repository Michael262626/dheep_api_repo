import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Gift, GiftDocument } from '../gifts/schemas/gift.schema';
import { AuditLogService } from '../audit-log/audit-log.service';

export interface EventParticipationFlow {
  eventId: string;
  userId: string;
  step: 'welcome' | 'terms' | 'tiles' | 'success' | 'completed';
  termsAccepted: boolean;
  tilesInteracted: number;
  completedAt?: Date;
}

@Injectable()
export class EventParticipationService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Gift.name) private giftModel: Model<GiftDocument>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async startEventParticipation(eventId: string, userId: string): Promise<{
    event: Event;
    step: string;
    message: string;
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'active') {
      throw new BadRequestException('Event is not active');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already participated
    if (user.participatedEvents.includes(new Types.ObjectId(eventId))) {
      throw new BadRequestException('User already participated in this event');
    }

    await this.auditLogService.createLog({
      action: 'event_participation_started',
      user: userId,
      target: eventId,
      metadata: { eventTitle: event.title },
    });

    return {
      event,
      step: 'welcome',
      message: `Welcome to ${event.title}! Please read the terms and conditions to continue.`,
    };
  }

  async acceptTerms(eventId: string, userId: string): Promise<{
    step: string;
    message: string;
    terms: string;
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user terms acceptance
    user.termsAccepted = true;
    user.termsAcceptedAt = new Date();
    await user.save();

    await this.auditLogService.createLog({
      action: 'terms_accepted',
      user: userId,
      target: eventId,
      metadata: { eventTitle: event.title },
    });

    return {
      step: 'tiles',
      message: 'Terms accepted! Now interact with the tiles to claim your gift.',
      terms: event.termsAndConditions || 'No terms and conditions specified.',
    };
  }

  async interactWithTiles(eventId: string, userId: string, tileCount: number = 1): Promise<{
    step: string;
    message: string;
    tilesInteracted: number;
    totalTiles: number;
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.termsAccepted) {
      throw new BadRequestException('Terms must be accepted before interacting with tiles');
    }

    // Simulate tile interaction (in real app, this would be more complex)
    const currentTiles = user.tilesInteracted || 0;
    const newTiles = currentTiles + tileCount;

    // Update user's tile interaction count
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { tilesInteracted: newTiles }
    });

    await this.auditLogService.createLog({
      action: 'tiles_interacted',
      user: userId,
      target: eventId,
      metadata: { 
        eventTitle: event.title, 
        tilesInteracted: newTiles,
        previousTiles: currentTiles 
      },
    });

    // Check if user has interacted with enough tiles to complete
    if (newTiles >= 3) { // Assuming 3 tiles are required
      return {
        step: 'success',
        message: 'Congratulations! You have successfully completed the event.',
        tilesInteracted: newTiles,
        totalTiles: 3,
      };
    }

    return {
      step: 'tiles',
      message: `Great! You've interacted with ${newTiles} tiles. Keep going!`,
      tilesInteracted: newTiles,
      totalTiles: 3,
    };
  }

  async completeEventParticipation(eventId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    event: Event;
    qrCode: string;
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.termsAccepted) {
      throw new BadRequestException('Terms must be accepted before completing the event');
    }

    if ((user.tilesInteracted || 0) < 3) {
      throw new BadRequestException('Must interact with at least 3 tiles to complete the event');
    }

    // Add event to user's participated events
    if (!user.participatedEvents.includes(new Types.ObjectId(eventId))) {
      user.participatedEvents.push(new Types.ObjectId(eventId));
    }

    // Add event to user's completed events
    if (!user.completedEvents.includes(new Types.ObjectId(eventId))) {
      user.completedEvents.push(new Types.ObjectId(eventId));
    }

    await user.save();

    // Update event statistics
    event.totalTiles += 1;
    event.successfulDeeps += 1;
    await event.save();

    // Generate QR code for gift redemption
    const qrData = `event:${eventId}:user:${userId}`;
    const qrCode = await this.generateQRCode(qrData);

    await this.auditLogService.createLog({
      action: 'event_completed',
      user: userId,
      target: eventId,
      metadata: { 
        eventTitle: event.title,
        tilesInteracted: user.tilesInteracted,
        completionTime: new Date()
      },
    });

    return {
      success: true,
      message: 'Event completed successfully! You can now redeem your gift using the QR code.',
      event,
      qrCode,
    };
  }

  async getEventParticipationStatus(eventId: string, userId: string): Promise<{
    event: Event;
    userStatus: {
      hasParticipated: boolean;
      hasCompleted: boolean;
      termsAccepted: boolean;
      tilesInteracted: number;
      currentStep: string;
    };
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasParticipated = user.participatedEvents.includes(new Types.ObjectId(eventId));
    const hasCompleted = user.completedEvents.includes(new Types.ObjectId(eventId));
    const termsAccepted = user.termsAccepted || false;
    const tilesInteracted = user.tilesInteracted || 0;

    let currentStep = 'not_started';
    if (hasCompleted) {
      currentStep = 'completed';
    } else if (tilesInteracted >= 3) {
      currentStep = 'ready_to_complete';
    } else if (tilesInteracted > 0) {
      currentStep = 'tiles';
    } else if (termsAccepted) {
      currentStep = 'tiles';
    } else if (hasParticipated) {
      currentStep = 'terms';
    }

    return {
      event,
      userStatus: {
        hasParticipated,
        hasCompleted,
        termsAccepted,
        tilesInteracted,
        currentStep,
      },
    };
  }

  private async generateQRCode(data: string): Promise<string> {
    // This would use the QRCode library to generate a QR code
    // For now, returning a placeholder
    return `data:image/png;base64,${Buffer.from(data).toString('base64')}`;
  }
}
