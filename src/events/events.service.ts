import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as QRCode from 'qrcode';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createEventDto: Partial<Event>): Promise<Event> {
    const createdEvent = new this.eventModel(createEventDto);
    await createdEvent.save();
    // Generate QR code as data URL encoding the event ID
    const qrData = `event:${createdEvent._id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    createdEvent.qrCode = qrCodeDataUrl;
    await createdEvent.save();
    return createdEvent;
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().populate('organization').exec();
  }

  async findOne(id: string): Promise<Event | null> {
    return this.eventModel.findById(id).populate('organization').exec();
  }

  async update(id: string, updateEventDto: Partial<Event>): Promise<Event | null> {
    return this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Event | null> {
    return this.eventModel.findByIdAndDelete(id).populate('organization').exec();
  }

  async participateInEvent(eventId: string, userId: string): Promise<{ success: boolean; event: Event }> {
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

    // Add event to user's participated events
    user.participatedEvents.push(new Types.ObjectId(eventId));
    await user.save();

    // Update event statistics
    event.totalTiles += 1;
    event.successfulDeeps += 1;
    await event.save();

    return { success: true, event };
  }

  async completeEvent(eventId: string, userId: string): Promise<{ success: boolean; event: Event }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user participated in this event
    if (!user.participatedEvents.includes(new Types.ObjectId(eventId))) {
      throw new BadRequestException('User has not participated in this event');
    }

    // Check if user already completed this event
    if (user.completedEvents.includes(new Types.ObjectId(eventId))) {
      throw new BadRequestException('User already completed this event');
    }

    // Add event to user's completed events
    user.completedEvents.push(new Types.ObjectId(eventId));
    await user.save();

    return { success: true, event };
  }

  async getEventStatistics(eventId: string): Promise<{
    totalTiles: number;
    successfulDeeps: number;
    undeeped: number;
    giftsRedeemed: number;
    giftsUnredeemed: number;
  }> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      totalTiles: event.totalTiles,
      successfulDeeps: event.successfulDeeps,
      undeeped: event.totalTiles - event.successfulDeeps,
      giftsRedeemed: event.giftsRedeemed,
      giftsUnredeemed: event.giftsUnredeemed,
    };
  }

  async getUserEventHistory(userId: string): Promise<Event[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const eventIds = user.participatedEvents.map(id => id.toString());
    return this.eventModel.find({ _id: { $in: eventIds } }).populate('organization').exec();
  }

  async getOrganizationEvents(orgId: string): Promise<Event[]> {
    return this.eventModel.find({ organization: orgId }).populate('organization').exec();
  }

  async updateEventStatus(eventId: string, status: 'active' | 'completed' | 'cancelled'): Promise<Event> {
    const event = await this.eventModel.findByIdAndUpdate(
      eventId, 
      { status }, 
      { new: true }
    ).populate('organization');
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }
}