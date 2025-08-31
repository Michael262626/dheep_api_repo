import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { Roles, AdminRole } from './admin-role.guard';
import { OrganizationsService } from '../organizations/organizations.service';
import { EventsService } from '../events/events.service';
import { GiftsService } from '../gifts/gifts.service';
import { UsersService } from '../users/users.service';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Admin Portal')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminDashboardService: AdminDashboardService,
    private readonly organizationsService: OrganizationsService,
    private readonly eventsService: EventsService,
    private readonly giftsService: GiftsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('portal')
  @ApiOperation({ summary: 'Serve admin portal HTML interface' })
  @ApiResponse({ status: 200, description: 'Admin portal HTML page' })
  @ApiResponse({ status: 500, description: 'Admin portal not found' })
  async getAdminPortal(@Res() res: Response) {
    try {
      // Try multiple possible paths
      const possiblePaths = [
        join(__dirname, 'admin-portal.html'),
        join(process.cwd(), 'src', 'admin', 'admin-portal.html'),
        join(process.cwd(), 'dist', 'src', 'admin', 'admin-portal.html'),
      ];
      
      let html = null;
      let htmlPath = null;
      
      for (const path of possiblePaths) {
        try {
          html = readFileSync(path, 'utf8');
          htmlPath = path;
          break;
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!html) {
        throw new Error('Admin portal HTML file not found in any expected location');
      }
      
      console.log('Admin portal loaded from:', htmlPath);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error loading admin portal:', error);
      res.status(500).send('Admin portal not found');
    }
  }

  // ==================== DASHBOARD ENDPOINTS ====================
  @Get('dashboard')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getDashboard() {
    return this.adminDashboardService.getDashboardStats();
  }

  @Get('dashboard/organization/:orgId')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get organization-specific dashboard' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization dashboard data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationDashboard(@Param('orgId') orgId: string) {
    return this.adminDashboardService.getOrganizationDashboard(orgId);
  }

  // ==================== SYSTEM OVERVIEW ====================

  @Get('system/overview')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system overview (super admin only)' })
  @ApiResponse({ status: 200, description: 'System overview retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSystemOverview() {
    return this.adminService.getSystemOverview();
  }

  @Get('system/health')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSystemHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  // ==================== ORGANIZATION MANAGEMENT ====================

  @Get('organizations')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all organizations with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllOrganizations(@Query('page') page = 1, @Query('limit') limit = 20) {
    const skip = (page - 1) * limit;
    const organizations = await this.organizationsService.findAll();
    const total = organizations.length;
    
    return {
      organizations: organizations.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get('organizations/:id')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganization(@Param('id') id: string) {
    return this.adminService.getOrganizationDetails(id);
  }

  @Put('organizations/:id/status')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization status' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'suspended', 'deleted'], example: 'active', description: 'New organization status' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Organization status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateOrganizationStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'suspended' | 'deleted' },
  ) {
    return this.adminService.updateOrganizationStatus(id, body.status);
  }

  @Post('organizations/:id/logo')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Upload organization logo' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Logo file (JPG/PNG, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Logo file is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async uploadOrganizationLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    // TODO: Implement logo upload to Cloudinary
    const logoUrl = `https://example.com/logos/${file.filename}`;
    
    const organization = await this.organizationsService.update(id, { logo: logoUrl });
    return { success: true, logoUrl, organization };
  }

  @Get('organizations/search')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Search organizations' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query (minimum 2 characters)' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Search query must be at least 2 characters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async searchOrganizations(@Query('q') query: string) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }
    return this.adminService.searchOrganizations(query);
  }

  // ==================== EVENT MANAGEMENT ====================

  @Get('events')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN, AdminRole.EVENT_MANAGER)
  @ApiOperation({ summary: 'Get all events with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Event status filter' })
  @ApiQuery({ name: 'organization', required: false, type: String, description: 'Organization filter' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('organization') organization?: string,
  ) {
    let events = await this.eventsService.findAll();
    
    if (status) {
      events = events.filter(event => event.status === status);
    }
    
    if (organization) {
      events = events.filter(event => event.organization.toString() === organization);
    }

    const total = events.length;
    const skip = (page - 1) * limit;
    
    return {
      events: events.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get('events/:id')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN, AdminRole.EVENT_MANAGER)
  @ApiOperation({ summary: 'Get event with analytics' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('id') id: string) {
    return this.adminService.getEventAnalytics(id);
  }

  @Put('events/:id/status')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN, AdminRole.EVENT_MANAGER)
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'completed' | 'cancelled' },
  ) {
    return this.eventsService.updateEventStatus(id, body.status);
  }

  @Delete('events/:id')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  // ==================== USER MANAGEMENT ====================

  @Get('users')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'verified', required: false, type: Boolean, description: 'Filter by verification status' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('verified') verified?: boolean,
  ) {
    let users = await this.usersService.findAll();
    
    if (verified !== undefined) {
      users = users.filter(user => user.isVerified === verified);
    }

    const total = users.length;
    const skip = (page - 1) * limit;
    
    return {
      users: users.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get('users/:id')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get user with analytics' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserAnalytics(id);
  }

  @Get('users/search')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query (minimum 2 characters)' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Search query must be at least 2 characters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async searchUsers(@Query('q') query: string) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }
    return this.adminService.searchUsers(query);
  }

  // ==================== GIFT MANAGEMENT ====================

  @Get('gifts')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN, AdminRole.GIFT_MANAGER)
  @ApiOperation({ summary: 'Get all gifts with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'claimed', required: false, type: Boolean, description: 'Filter by claimed status' })
  @ApiQuery({ name: 'event', required: false, type: String, description: 'Filter by event' })
  @ApiResponse({ status: 200, description: 'Gifts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllGifts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('claimed') claimed?: boolean,
    @Query('event') event?: string,
  ) {
    let gifts = await this.giftsService.findAll();
    
    if (claimed !== undefined) {
      gifts = gifts.filter(gift => gift.claimed === claimed);
    }
    
    if (event) {
      gifts = gifts.filter(gift => gift.event.toString() === event);
    }

    const total = gifts.length;
    const skip = (page - 1) * limit;
    
    return {
      gifts: gifts.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get('gifts/statistics')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN, AdminRole.GIFT_MANAGER)
  @ApiOperation({ summary: 'Get gift statistics' })
  @ApiQuery({ name: 'event', required: false, type: String, description: 'Event ID (optional)' })
  @ApiQuery({ name: 'organization', required: false, type: String, description: 'Organization ID (optional)' })
  @ApiResponse({ status: 200, description: 'Gift statistics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Either event or organization parameter is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getGiftStatistics(
    @Query('event') eventId?: string,
    @Query('organization') orgId?: string,
  ) {
    if (eventId) {
      return this.giftsService.getEventGiftStatistics(eventId);
    }
    
    if (orgId) {
      return this.giftsService.getOrganizationGiftStatistics(orgId);
    }
    
    throw new BadRequestException('Either event or organization parameter is required');
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-logs')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Action filter' })
  @ApiQuery({ name: 'user', required: false, type: String, description: 'User filter' })
  @ApiQuery({ name: 'organization', required: false, type: String, description: 'Organization filter' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum results (default: 100)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('user') user?: string,
    @Query('organization') organization?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = 100,
  ) {
    const filters: any = {};
    
    if (action) filters.action = action;
    if (user) filters.user = user;
    if (organization) filters.organization = organization;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit.toString());

    return this.adminService.getAuditLogs(filters);
  }

  // ==================== REPORTS & EXPORTS ====================

  @Get('reports/organizations')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export organizations report' })
  @ApiResponse({ status: 200, description: 'Organizations report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async exportOrganizationsReport() {
    const organizations = await this.organizationsService.findAll();
    
    // TODO: Implement CSV/Excel export
    return {
      success: true,
      message: 'Organizations report generated successfully',
      data: organizations,
      format: 'json', // TODO: Support CSV/Excel
    };
  }

  @Get('reports/events')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Export events report' })
  @ApiQuery({ name: 'organization', required: false, type: String, description: 'Organization ID (optional)' })
  @ApiResponse({ status: 200, description: 'Events report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async exportEventsReport(@Query('organization') orgId?: string) {
    let events = await this.eventsService.findAll();
    
    if (orgId) {
      events = events.filter(event => event.organization.toString() === orgId);
    }
    
    // TODO: Implement CSV/Excel export
    return {
      success: true,
      message: 'Events report generated successfully',
      data: events,
      format: 'json', // TODO: Support CSV/Excel
    };
  }

  @Get('reports/users')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Export users report' })
  @ApiQuery({ name: 'organization', required: false, type: String, description: 'Organization ID (optional)' })
  @ApiResponse({ status: 200, description: 'Users report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async exportUsersReport(@Query('organization') orgId?: string) {
    let users = await this.usersService.findAll();
    
    if (orgId) {
      // Filter users by organization events
      const orgEvents = await this.eventsService.getOrganizationEvents(orgId);
      const orgEventIds = orgEvents.map(event => (event as any)._id?.toString());
      
      users = users.filter(user => 
        user.participatedEvents.some(eventId => 
          orgEventIds.includes(eventId.toString())
        )
      );
    }
    
    // TODO: Implement CSV/Excel export
    return {
      success: true,
      message: 'Users report generated successfully',
      data: users,
      format: 'json', // TODO: Support CSV/Excel
    };
  }
}