import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async createLog(params: {
    action: string;
    user?: string | Types.ObjectId;
    organization?: string | Types.ObjectId;
    target?: string;
    metadata?: Record<string, any>;
  }) {
    const log = new this.auditLogModel({
      action: params.action,
      user: params.user,
      organization: params.organization,
      target: params.target,
      metadata: params.metadata,
    });
    await log.save();
    return log;
  }

  async findLogs(filters: {
    action?: string;
    user?: string;
    organization?: string;
    target?: string;
  }) {
    const query: any = {};
    if (filters.action) query.action = filters.action;
    if (filters.user) query.user = filters.user;
    if (filters.organization) query.organization = filters.organization;
    if (filters.target) query.target = filters.target;
    return this.auditLogModel.find(query).sort({ createdAt: -1 }).lean();
  }
}