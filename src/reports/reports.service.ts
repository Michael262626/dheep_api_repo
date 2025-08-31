import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Gift, GiftDocument } from '../gifts/schemas/gift.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Gift.name) private giftModel: Model<GiftDocument>,
  ) {}

  async generateEventParticipationCsv(eventId: string): Promise<string> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const participants = await this.userModel.find({
      participatedEvents: eventId
    });

    const gifts = await this.giftModel.find({ event: eventId });

    // Generate CSV content
    const csvRows = [
      ['Event Title', 'Event Date', 'Participant Phone', 'Terms Accepted', 'Tiles Interacted', 'Gifts Claimed', 'Gifts Redeemed']
    ];

    for (const participant of participants) {
      const userGifts = gifts.filter(gift => gift.claimedBy?.toString() === participant._id.toString());
      const claimedCount = userGifts.length;
      const redeemedCount = userGifts.filter(gift => gift.collectedAt).length;

      csvRows.push([
        event.title,
        event.date.toISOString().split('T')[0],
        participant.phone,
        participant.termsAccepted ? 'Yes' : 'No',
        participant.participatedEvents.length.toString(),
        claimedCount.toString(),
        redeemedCount.toString()
      ]);
    }

    return csvRows.map(row => row.join(',')).join('\n');
  }
}
