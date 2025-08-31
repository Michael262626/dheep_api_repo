import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Gift, GiftDocument } from './schemas/gift.schema';
import { Event, EventDocument } from '../events/schemas/event.schema';
import * as QRCode from 'qrcode';
import { AuditLogService } from '../audit-log/audit-log.service';
import * as XLSX from 'xlsx';

@Injectable()
export class GiftsService {
  constructor(
    @InjectModel(Gift.name) private giftModel: Model<GiftDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createGiftDto: Partial<Gift>): Promise<Gift> {
    const gift = new this.giftModel(createGiftDto);
    return gift.save();
  }

  async findAll(): Promise<Gift[]> {
    return this.giftModel.find().populate('event').populate('claimedBy').populate('redeemedBy').exec();
  }

  async findOne(id: string): Promise<Gift | null> {
    return this.giftModel.findById(id).populate('event').populate('claimedBy').populate('redeemedBy').exec();
  }

  async update(id: string, updateGiftDto: Partial<Gift>): Promise<Gift | null> {
    return this.giftModel.findByIdAndUpdate(id, updateGiftDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Gift | null> {
    return this.giftModel.findByIdAndDelete(id).exec();
  }

  async processGiftInventoryFile(eventId: string, file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new BadRequestException('No data found in file');
    }

    const createdGifts = [];
    let totalQuantity = 0;
    
    for (const row of rows) {
      if (!row.name || !row.quantity) continue;
      const gift = new this.giftModel({
        event: eventId,
        name: row.name,
        quantity: Number(row.quantity),
      });
      await gift.save();
      createdGifts.push(gift);
      totalQuantity += Number(row.quantity);
    }

    // Update event statistics
    await this.eventModel.findByIdAndUpdate(eventId, {
      $inc: { totalTiles: totalQuantity, giftsUnredeemed: totalQuantity }
    });

    return {
      message: `${createdGifts.length} gifts uploaded successfully`,
      gifts: createdGifts,
      totalQuantity,
    };
  }

  async claimGift(giftId: string, userId: string) {
    const gift = await this.giftModel.findById(giftId);
    if (!gift) throw new BadRequestException('Gift not found');
    if (gift.claimed) throw new ForbiddenException('Gift already claimed');
    
    gift.claimed = true;
    gift.claimedBy = new Types.ObjectId(userId);
    
    // Generate QR code as data URL encoding the gift ID
    const qrData = `gift:${gift._id}`;
    gift.qrCode = await QRCode.toDataURL(qrData);
    await gift.save();
    
    await this.auditLogService.createLog({
      action: 'gift_claimed',
      user: userId,
      target: gift._id.toString(),
      metadata: { event: gift.event, giftName: gift.name },
    });
    
    return gift;
  }

  async redeemGift(giftId: string, orgId: string) {
    const gift = await this.giftModel.findById(giftId);
    if (!gift) throw new BadRequestException('Gift not found');
    if (!gift.claimed) throw new ForbiddenException('Gift must be claimed before redemption');
    if (gift.collectedAt) throw new ForbiddenException('Gift already redeemed');
    
    gift.collectedAt = new Date();
    gift.redeemedBy = new Types.ObjectId(orgId);
    await gift.save();
    
    // Update event statistics
    await this.eventModel.findByIdAndUpdate(gift.event, {
      $inc: { giftsRedeemed: 1, giftsUnredeemed: -1 }
    });
    
    await this.auditLogService.createLog({
      action: 'gift_redeemed',
      organization: orgId,
      target: gift._id.toString(),
      metadata: { event: gift.event, giftName: gift.name, claimedBy: gift.claimedBy },
    });
    
    return gift;
  }

  async getUserGiftHistory(userId: string) {
    return this.giftModel.find({ claimedBy: userId })
      .populate('event')
      .populate('redeemedBy')
      .lean();
  }

  async getEventGiftStatistics(eventId: string) {
    const [totalGifts, claimedGifts, redeemedGifts] = await Promise.all([
      this.giftModel.aggregate([
        { $match: { event: new Types.ObjectId(eventId) } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      this.giftModel.countDocuments({ event: eventId, claimed: true }),
      this.giftModel.countDocuments({ event: eventId, collectedAt: { $exists: true } })
    ]);

    return {
      totalGifts: totalGifts[0]?.total || 0,
      claimedGifts,
      redeemedGifts,
      unclaimedGifts: (totalGifts[0]?.total || 0) - claimedGifts,
      unredeemedGifts: claimedGifts - redeemedGifts,
    };
  }

  async getOrganizationGiftStatistics(orgId: string) {
    const events = await this.eventModel.find({ organization: orgId }).select('_id title date');
    const eventIds = events.map(event => event._id);
    
    const giftStats = await this.giftModel.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $group: { 
        _id: '$event', 
        totalGifts: { $sum: '$quantity' },
        claimedGifts: { $sum: { $cond: ['$claimed', 1, 0] } },
        redeemedGifts: { $sum: { $cond: [{ $exists: ['$collectedAt'] }, 1, 0] } }
      }}
    ]);

    return events.map(event => {
      const stats = giftStats.find(stat => stat._id.toString() === event._id.toString()) || {
        totalGifts: 0,
        claimedGifts: 0,
        redeemedGifts: 0
      };
      
      return {
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        ...stats,
        unclaimedGifts: stats.totalGifts - stats.claimedGifts,
        unredeemedGifts: stats.claimedGifts - stats.redeemedGifts,
      };
    });
  }
}