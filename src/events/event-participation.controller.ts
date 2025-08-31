import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { EventParticipationService } from './event-participation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Event Participation')
@ApiBearerAuth()
@Controller('event-participation')
export class EventParticipationController {
  constructor(private readonly eventParticipationService: EventParticipationService) {}

  @Post(':eventId/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start participating in an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event participation started successfully' })
  @ApiResponse({ status: 400, description: 'Already participating or event not available' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startEventParticipation(
    @Param('eventId') eventId: string,
    @Req() req,
  ) {
    const userId = req.user?.userId;
    return this.eventParticipationService.startEventParticipation(eventId, userId);
  }

  @Post(':eventId/accept-terms')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept event terms and conditions' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Terms accepted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot accept terms' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async acceptTerms(
    @Param('eventId') eventId: string,
    @Req() req,
  ) {
    const userId = req.user?.userId;
    return this.eventParticipationService.acceptTerms(eventId, userId);
  }

  @Post(':eventId/interact-tiles')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Interact with event tiles' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tileCount: { type: 'number', example: 1, description: 'Number of tiles to interact with (default: 1)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tile interaction successful' })
  @ApiResponse({ status: 400, description: 'Cannot interact with tiles' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async interactWithTiles(
    @Param('eventId') eventId: string,
    @Body() body: { tileCount?: number },
    @Req() req,
  ) {
    const userId = req.user?.userId;
    const tileCount = body.tileCount || 1;
    return this.eventParticipationService.interactWithTiles(eventId, userId, tileCount);
  }

  @Post(':eventId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete event participation' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event participation completed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot complete event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeEventParticipation(
    @Param('eventId') eventId: string,
    @Req() req,
  ) {
    const userId = req.user?.userId;
    return this.eventParticipationService.completeEventParticipation(eventId, userId);
  }

  @Get(':eventId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user participation status for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Participation status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEventParticipationStatus(
    @Param('eventId') eventId: string,
    @Req() req,
  ) {
    const userId = req.user?.userId;
    return this.eventParticipationService.getEventParticipationStatus(eventId, userId);
  }
}
