import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiParam, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('event/:eventId/participation')
  @ApiParam({ name: 'eventId', required: true, description: 'ID of the event to report on' })
  @ApiOperation({ summary: 'Download event participation and redemption report as CSV (admin only)' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventParticipationReport(
    @Param('eventId') eventId: string,
    @Res() res: Response,
  ) {
    const csv = await this.reportsService.generateEventParticipationCsv(eventId);
    res.header('Content-Type', 'text/csv');
    res.attachment(`event_${eventId}_participation.csv`);
    return res.send(csv);
  }
}