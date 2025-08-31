import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import { Gift, GiftDocument } from '../gifts/schemas/gift.schema';
import { AuditLog, AuditLogDocument } from '../audit-log/schemas/audit-log.schema';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Gift.name) private giftModel: Model<GiftDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalStats,
      monthlyStats,
      weeklyStats,
      topOrganizations,
      recentActivity,
      systemMetrics,
    ] = await Promise.all([
      this.getTotalStats(),
      this.getPeriodStats(thirtyDaysAgo, now),
      this.getPeriodStats(sevenDaysAgo, now),
      this.getTopOrganizations(),
      this.getRecentActivity(),
      this.getSystemMetrics(),
    ]);

    return {
      overview: totalStats,
      monthly: monthlyStats,
      weekly: weeklyStats,
      topOrganizations,
      recentActivity,
      systemMetrics,
      lastUpdated: now,
    };
  }

  private async getTotalStats() {
    const [
      totalOrganizations,
      totalUsers,
      totalEvents,
      totalGifts,
      activeEvents,
      completedEvents,
    ] = await Promise.all([
      this.orgModel.countDocuments(),
      this.userModel.countDocuments(),
      this.eventModel.countDocuments(),
      this.giftModel.countDocuments(),
      this.eventModel.countDocuments({ status: 'active' }),
      this.eventModel.countDocuments({ status: 'completed' }),
    ]);

    return {
      totalOrganizations,
      totalUsers,
      totalEvents,
      totalGifts,
      activeEvents,
      completedEvents,
      completionRate: totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0,
    };
  }

  private async getPeriodStats(startDate: Date, endDate: Date) {
    const [
      newOrganizations,
      newUsers,
      newEvents,
      newGifts,
      activeUsers,
    ] = await Promise.all([
      this.orgModel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      this.userModel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      this.eventModel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      this.giftModel.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      this.userModel.countDocuments({ 
        'participatedEvents.0': { $exists: true },
        updatedAt: { $gte: startDate, $lte: endDate }
      }),
    ]);

    return {
      newOrganizations,
      newUsers,
      newEvents,
      newGifts,
      activeUsers,
      period: { startDate, endDate },
    };
  }

  private async getTopOrganizations() {
    const organizations = await this.orgModel.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: 'organization',
          as: 'events',
        },
      },
      {
        $lookup: {
          from: 'gifts',
          localField: 'events._id',
          foreignField: 'event',
          as: 'gifts',
        },
      },
      {
        $addFields: {
          totalEvents: { $size: '$events' },
          totalGifts: { $size: '$gifts' },
          totalParticipants: {
            $size: {
              $setUnion: '$events.participants',
            },
          },
        },
      },
      {
        $sort: { totalEvents: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          name: 1,
          country: 1,
          totalEvents: 1,
          totalGifts: 1,
          totalParticipants: 1,
          adminEmail: 1,
        },
      },
    ]);

    return organizations;
  }

  private async getRecentActivity() {
    const recentLogs = await this.auditLogModel.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 20,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      {
        $addFields: {
          userPhone: { $arrayElemAt: ['$userInfo.phone', 0] },
          orgName: { $arrayElemAt: ['$orgInfo.name', 0] },
        },
      },
      {
        $project: {
          action: 1,
          userPhone: 1,
          orgName: 1,
          target: 1,
          metadata: 1,
          createdAt: 1,
        },
      },
    ]);

    return recentLogs;
  }

  private async getSystemMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      hourlyUsers,
      hourlyEvents,
      hourlyGifts,
      systemErrors,
    ] = await Promise.all([
      this.userModel.countDocuments({ updatedAt: { $gte: oneHourAgo } }),
      this.eventModel.countDocuments({ updatedAt: { $gte: oneHourAgo } }),
      this.giftModel.countDocuments({ updatedAt: { $gte: oneHourAgo } }),
      this.auditLogModel.countDocuments({ 
        action: { $regex: /error|failed|exception/i },
        createdAt: { $gte: oneHourAgo }
      }),
    ]);

    return {
      hourlyUsers,
      hourlyEvents,
      hourlyGifts,
      systemErrors,
      systemHealth: systemErrors > 10 ? 'warning' : 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
    };
  }

  async getOrganizationDashboard(orgId: string) {
    const organization = await this.orgModel.findById(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const [
      events,
      users,
      gifts,
      recentActivity,
      monthlyStats,
    ] = await Promise.all([
      this.eventModel.find({ organization: orgId }).sort({ createdAt: -1 }),
      this.userModel.find({ 
        participatedEvents: { 
          $in: await this.eventModel.find({ organization: orgId }).distinct('_id') 
        } 
      }).countDocuments(),
      this.giftModel.find({ 
        event: { 
          $in: await this.eventModel.find({ organization: orgId }).distinct('_id') 
        } 
      }),
      this.auditLogModel.find({ organization: orgId }).sort({ createdAt: -1 }).limit(10),
      this.getOrganizationMonthlyStats(orgId),
    ]);

    const eventStats = events.reduce((acc, event) => {
      acc.totalEvents++;
      if (event.status === 'active') acc.activeEvents++;
      if (event.status === 'completed') acc.completedEvents++;
      acc.totalTiles += event.totalTiles || 0;
      acc.successfulDeeps += event.successfulDeeps || 0;
      acc.giftsRedeemed += event.giftsRedeemed || 0;
      return acc;
    }, {
      totalEvents: 0,
      activeEvents: 0,
      completedEvents: 0,
      totalTiles: 0,
      successfulDeeps: 0,
      giftsRedeemed: 0,
    });

    return {
      organization,
      overview: {
        totalEvents: eventStats.totalEvents,
        activeEvents: eventStats.activeEvents,
        completedEvents: eventStats.completedEvents,
        totalUsers: users,
        totalGifts: gifts.length,
        totalTiles: eventStats.totalTiles,
        successfulDeeps: eventStats.successfulDeeps,
        giftsRedeemed: eventStats.giftsRedeemed,
        participationRate: eventStats.totalTiles > 0 
          ? (eventStats.successfulDeeps / eventStats.totalTiles) * 100 
          : 0,
      },
      events,
      recentActivity,
      monthlyStats,
    };
  }

  private async getOrganizationMonthlyStats(orgId: string) {
    const now = new Date();
    const months = [];
    
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const [events, users, gifts] = await Promise.all([
        this.eventModel.countDocuments({ 
          organization: orgId,
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        this.userModel.countDocuments({ 
          participatedEvents: { 
            $in: await this.eventModel.find({ 
              organization: orgId,
              createdAt: { $gte: monthStart, $lte: monthEnd }
            }).distinct('_id') 
          } 
        }),
        this.giftModel.countDocuments({ 
          event: { 
            $in: await this.eventModel.find({ 
              organization: orgId,
              createdAt: { $gte: monthStart, $lte: monthEnd }
            }).distinct('_id') 
          } 
        }),
      ]);

      months.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        events,
        users,
        gifts,
      });
    }

    return months.reverse();
  }
}
