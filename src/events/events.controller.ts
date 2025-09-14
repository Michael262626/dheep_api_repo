import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './schemas/event.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Summer Festival 2024', description: 'Event title' },
        description: { type: 'string', example: 'Annual summer celebration', description: 'Event description' },
        date: { type: 'string', format: 'date-time', example: '2024-07-15T18:00:00Z', description: 'Event date and time' },
        instructions: { type: 'string', example: '<p>Follow the instructions...</p>', description: 'Event instructions (HTML)' },
        termsAndConditions: { type: 'string', example: '<p>Terms and conditions...</p>', description: 'Terms and conditions (HTML)' },
        tileBackgroundImage: { type: 'string', example: 'https://example.com/bg.jpg', description: 'Tile background image URL' },
        totalTiles: { type: 'number', example: 100, description: 'Total number of tiles' },
      },
      required: ['title', 'description', 'date', 'instructions', 'termsAndConditions', 'totalTiles'],
    },
  })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createEventDto: Partial<Event>, @Req() req) {
    // Ensure the event is created for the authenticated organization
    const orgId = req.user?.userId;
    createEventDto.organization = orgId;
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'List of all events' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('organization/:orgId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get events for specific organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization events found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOrganizationEvents(@Param('orgId') orgId: string) {
    return this.eventsService.getOrganizationEvents(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getEventStatistics(@Param('id') id: string) {
    return this.eventsService.getEventStatistics(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Summer Festival 2024', description: 'Event title' },
        description: { type: 'string', example: 'Annual summer celebration', description: 'Event description' },
        date: { type: 'string', format: 'date-time', example: '2024-07-15T18:00:00Z', description: 'Event date and time' },
        instructions: { type: 'string', example: '<p>Follow the instructions...</p>', description: 'Event instructions (HTML)' },
        termsAndConditions: { type: 'string', example: '<p>Terms and conditions...</p>', description: 'Terms and conditions (HTML)' },
        tileBackgroundImage: { type: 'string', example: 'https://example.com/bg.jpg', description: 'Tile background image URL' },
        totalTiles: { type: 'number', example: 100, description: 'Total number of tiles' },
        status: { type: 'string', enum: ['active', 'completed', 'cancelled'], example: 'active', description: 'Event status' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() updateEventDto: Partial<Event>) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update event status' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'cancelled'], example: 'completed', description: 'New event status' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Event status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updateStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'completed' | 'cancelled' }) {
    return this.eventsService.updateEventStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post('validate-qr')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate a QR code and fetch corresponding event' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        qrCodeData: {
          type: 'string',
          example: 'event:66e55dbcd7f3489083f1a6f9',
          description: 'QR code data string generated for the event',
        },
      },
      required: ['qrCodeData'],
    },
  })
  @ApiResponse({ status: 200, description: 'QR code is valid and event details returned' })
  @ApiResponse({ status: 400, description: 'Invalid QR code format' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  validateQr(@Body('qrCodeData') qrCodeData: string) {
    return this.eventsService.validateQrCode(qrCodeData);
  }

  // User endpoints for event participation
  @Post(':id/participate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User participates in event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'User started participating in event' })
  @ApiResponse({ status: 400, description: 'Already participating or event not available' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  participateInEvent(@Param('id') eventId: string, @Req() req) {
    const userId = req.user?.userId;
    return this.eventsService.participateInEvent(eventId, userId);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User completes event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event completed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot complete event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  completeEvent(@Param('id') eventId: string, @Req() req) {
    const userId = req.user?.userId;
    return this.eventsService.completeEvent(eventId, userId);
  }

  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user event participation history' })
  @ApiResponse({ status: 200, description: 'User event history retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserEventHistory(@Req() req) {
    const userId = req.user?.userId;
    return this.eventsService.getUserEventHistory(userId);
  }
}