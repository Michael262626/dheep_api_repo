import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { Gift, GiftDocument } from '../gifts/schemas/gift.schema';
import { AuditLog, AuditLogDocument } from '../audit-log/schemas/audit-log.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Gift.name) private giftModel: Model<GiftDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async getSystemOverview() {
    const [
      totalOrganizations,
      totalUsers,
      totalEvents,
      totalGifts,
      recentAuditLogs,
    ] = await Promise.all([
      this.orgModel.countDocuments(),
      this.userModel.countDocuments(),
      this.eventModel.countDocuments(),
      this.giftModel.countDocuments(),
      this.auditLogModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'phone')
        .populate('organization', 'name')
        .exec(),
    ]);

    return {
      totalOrganizations,
      totalUsers,
      totalEvents,
      totalGifts,
      recentAuditLogs,
      systemHealth: 'healthy',
      lastUpdated: new Date(),
    };
  }

  async getOrganizationDetails(orgId: string) {
    const organization = await this.orgModel.findById(orgId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const [events, users, gifts] = await Promise.all([
      this.eventModel.find({ organization: orgId }).countDocuments(),
      this.userModel.find({ 
        participatedEvents: { 
          $in: await this.eventModel.find({ organization: orgId }).distinct('_id') 
        } 
      }).countDocuments(),
      this.giftModel.find({ 
        event: { 
          $in: await this.eventModel.find({ organization: orgId }).distinct('_id') 
        } 
      }).countDocuments(),
    ]);

    return {
      organization,
      statistics: {
        totalEvents: events,
        totalUsers: users,
        totalGifts: gifts,
      },
    };
  }

  async updateOrganizationStatus(orgId: string, status: 'active' | 'suspended' | 'deleted') {
    const organization = await this.orgModel.findByIdAndUpdate(
      orgId,
      { status },
      { new: true }
    );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async getUserAnalytics(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [participatedEvents, completedEvents, claimedGifts] = await Promise.all([
      this.eventModel.find({ _id: { $in: user.participatedEvents } }).select('title date'),
      this.eventModel.find({ _id: { $in: user.completedEvents } }).select('title date'),
      this.giftModel.find({ claimedBy: userId }).populate('event', 'title').populate('redeemedBy', 'name'),
    ]);

    return {
      user,
      analytics: {
        participatedEvents: participatedEvents.length,
        completedEvents: completedEvents.length,
        claimedGifts: claimedGifts.length,
        completionRate: participatedEvents.length > 0 
          ? (completedEvents.length / participatedEvents.length) * 100 
          : 0,
      },
      events: {
        participated: participatedEvents,
        completed: completedEvents,
      },
      gifts: claimedGifts,
    };
  }

  async getEventAnalytics(eventId: string) {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [participants, gifts, auditLogs] = await Promise.all([
      this.userModel.find({ participatedEvents: eventId }).countDocuments(),
      this.giftModel.find({ event: eventId }).countDocuments(),
      this.auditLogModel.find({ target: eventId }).sort({ createdAt: -1 }).limit(20),
    ]);

    return {
      event,
      analytics: {
        totalParticipants: participants,
        totalGifts: gifts,
        participationRate: event.totalTiles > 0 
          ? (event.successfulDeeps / event.totalTiles) * 100 
          : 0,
        giftRedemptionRate: event.giftsRedeemed > 0 
          ? (event.giftsRedeemed / event.giftsUnredeemed) * 100 
          : 0,
      },
      recentActivity: auditLogs,
    };
  }

  async searchUsers(query: string) {
    const users = await this.userModel.find({
      $or: [
        { phone: { $regex: query, $options: 'i' } },
        { deviceId: { $regex: query, $options: 'i' } },
      ],
    }).limit(20);

    return users;
  }

  async searchOrganizations(query: string) {
    const organizations = await this.orgModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { adminEmail: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } },
      ],
    }).limit(20);

    return organizations;
  }

  async getAuditLogs(filters: {
    action?: string;
    user?: string;
    organization?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const query: any = {};

    if (filters.action) query.action = filters.action;
    if (filters.user) query.user = filters.user;
    if (filters.organization) query.organization = filters.organization;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const logs = await this.auditLogModel.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100)
      .populate('user', 'phone')
      .populate('organization', 'name')
      .exec();

    return logs;
  }
}
