import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GiftsService } from '../gifts/gifts.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly giftsService: GiftsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+1234567890', description: 'Phone number' },
        deviceId: { type: 'string', example: 'device123', description: 'Device identifier' },
        name: { type: 'string', example: 'John Doe', description: 'User name (optional)' },
      },
      required: ['phone', 'deviceId'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createUserDto: Partial<User>) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string', example: '+1234567890', description: 'Phone number' },
        deviceId: { type: 'string', example: 'device123', description: 'Device identifier' },
        name: { type: 'string', example: 'John Doe', description: 'User name' },
        isVerified: { type: 'boolean', example: true, description: 'Verification status' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register or update FCM device token for push notifications (user only)' })
  @ApiBody({ schema: { type: 'object', properties: { fcmToken: { type: 'string' } } } })
  async updateFcmToken(@Body() body: { fcmToken: string }, @Req() req) {
    const userId = req.user?.userId;
    if (!userId) return { success: false, message: 'User not found in token' };
    await this.usersService.update(userId, { fcmToken: body.fcmToken });
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile (user only)' })
  async getMe(@Req() req) {
    const userId = req.user?.userId;
    if (!userId) return { success: false, message: 'User not found in token' };
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile (user only)' })
  @ApiBody({ schema: { type: 'object', properties: { phone: { type: 'string' }, deviceId: { type: 'string' }, fcmToken: { type: 'string' } } } })
  async updateMe(@Body() updateUserDto: Partial<User>, @Req() req) {
    const userId = req.user?.userId;
    if (!userId) return { success: false, message: 'User not found in token' };
    return this.usersService.update(userId, updateUserDto);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user claim and redemption history (user only)' })
  async getMyHistory(@Req() req) {
    const userId = req.user?.userId;
    if (!userId) return { success: false, message: 'User not found in token' };
    return this.giftsService.getUserGiftHistory(userId);
  }
}
