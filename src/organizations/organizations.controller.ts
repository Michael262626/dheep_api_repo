import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './schemas/organization.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Organization', description: 'Organization name' },
        country: { type: 'string', example: 'US', description: 'Country code' },
        adminEmail: { type: 'string', example: 'admin@org.com', description: 'Admin email' },
        contactFirstName: { type: 'string', example: 'John', description: 'Contact first name' },
        contactLastName: { type: 'string', example: 'Doe', description: 'Contact last name' },
        contactMobile: { type: 'string', example: '+1234567890', description: 'Contact mobile' },
        logo: { type: 'string', example: 'https://example.com/logo.png', description: 'Logo URL (optional)' },
      },
      required: ['name', 'country', 'adminEmail', 'contactFirstName', 'contactLastName', 'contactMobile'],
    },
  })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createOrgDto: Partial<Organization>) {
    return this.organizationsService.create(createOrgDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'List of all organizations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization found' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Organization', description: 'Organization name' },
        country: { type: 'string', example: 'US', description: 'Country code' },
        adminEmail: { type: 'string', example: 'admin@org.com', description: 'Admin email' },
        contactFirstName: { type: 'string', example: 'John', description: 'Contact first name' },
        contactLastName: { type: 'string', example: 'Doe', description: 'Contact last name' },
        contactMobile: { type: 'string', example: '+1234567890', description: 'Contact mobile' },
        logo: { type: 'string', example: 'https://example.com/logo.png', description: 'Logo URL' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(@Param('id') id: string, @Body() updateOrgDto: Partial<Organization>) {
    return this.organizationsService.update(id, updateOrgDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }
}
