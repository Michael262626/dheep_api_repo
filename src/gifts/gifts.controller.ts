import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { Gift } from './schemas/gift.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Gifts')
@ApiBearerAuth()
@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new gift' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Gift Card', description: 'Gift name' },
        description: { type: 'string', example: 'Amazon gift card worth $50', description: 'Gift description' },
        event: { type: 'string', example: '507f1f77bcf86cd799439011', description: 'Event ID' },
        quantity: { type: 'number', example: 100, description: 'Available quantity' },
        claimed: { type: 'boolean', example: false, description: 'Whether gift is claimed' },
        redeemed: { type: 'boolean', example: false, description: 'Whether gift is redeemed' },
        claimedBy: { type: 'string', example: '507f1f77bcf86cd799439012', description: 'User ID who claimed it' },
        redeemedBy: { type: 'string', example: '507f1f77bcf86cd799439013', description: 'Organization ID who redeemed it' },
      },
      required: ['name', 'description', 'event', 'quantity'],
    },
  })
  @ApiResponse({ status: 201, description: 'Gift created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createGiftDto: Partial<Gift>) {
    return this.giftsService.create(createGiftDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gifts' })
  @ApiResponse({ status: 200, description: 'List of all gifts' })
  findAll() {
    return this.giftsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gift by ID' })
  @ApiParam({ name: 'id', description: 'Gift ID' })
  @ApiResponse({ status: 200, description: 'Gift found' })
  @ApiResponse({ status: 404, description: 'Gift not found' })
  findOne(@Param('id') id: string) {
    return this.giftsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update gift' })
  @ApiParam({ name: 'id', description: 'Gift ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Gift Card', description: 'Gift name' },
        description: { type: 'string', example: 'Amazon gift card worth $50', description: 'Gift description' },
        quantity: { type: 'number', example: 100, description: 'Available quantity' },
        claimed: { type: 'boolean', example: false, description: 'Whether gift is claimed' },
        redeemed: { type: 'boolean', example: false, description: 'Whether gift is redeemed' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Gift updated successfully' })
  @ApiResponse({ status: 404, description: 'Gift not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() updateGiftDto: Partial<Gift>) {
    return this.giftsService.update(id, updateGiftDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete gift' })
  @ApiParam({ name: 'id', description: 'Gift ID' })
  @ApiResponse({ status: 200, description: 'Gift deleted successfully' })
  @ApiResponse({ status: 404, description: 'Gift not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.giftsService.remove(id);
  }

  @Post('upload/:eventId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload gift inventory file (Excel/CSV)' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Gift inventory file (Excel/CSV)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Gift inventory uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async uploadGiftInventory(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.giftsService.processGiftInventoryFile(eventId, file);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User claims a gift' })
  @ApiParam({ name: 'id', description: 'Gift ID' })
  @ApiResponse({ status: 200, description: 'Gift claimed successfully' })
  @ApiResponse({ status: 400, description: 'Gift already claimed or not available' })
  @ApiResponse({ status: 404, description: 'Gift not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  claimGift(@Param('id') giftId: string, @Req() req) {
    const userId = req.user?.userId;
    return this.giftsService.claimGift(giftId, userId);
  }

  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Organization redeems a claimed gift' })
  @ApiParam({ name: 'id', description: 'Gift ID' })
  @ApiResponse({ status: 200, description: 'Gift redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Gift not claimed or already redeemed' })
  @ApiResponse({ status: 404, description: 'Gift not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  redeemGift(@Param('id') giftId: string, @Req() req) {
    const orgId = req.user?.userId;
    return this.giftsService.redeemGift(giftId, orgId);
  }

  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user gift claim history' })
  @ApiResponse({ status: 200, description: 'User gift history retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserGiftHistory(@Req() req) {
    const userId = req.user?.userId;
    return this.giftsService.getUserGiftHistory(userId);
  }

  @Get('event/:eventId/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get gift statistics for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event gift statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getEventGiftStatistics(@Param('eventId') eventId: string) {
    return this.giftsService.getEventGiftStatistics(eventId);
  }

  @Get('organization/:orgId/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get gift statistics for an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization gift statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  getOrganizationGiftStatistics(@Param('orgId') orgId: string) {
    return this.giftsService.getOrganizationGiftStatistics(orgId);
  }
}