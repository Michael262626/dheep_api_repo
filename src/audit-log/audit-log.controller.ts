import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'View/filter audit logs (admin only)' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'user', required: false })
  @ApiQuery({ name: 'organization', required: false })
  @ApiQuery({ name: 'target', required: false })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('user') user?: string,
    @Query('organization') organization?: string,
    @Query('target') target?: string,
  ) {
    return this.auditLogService.findLogs({ action, user, organization, target });
  }
}