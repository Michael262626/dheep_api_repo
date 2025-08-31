import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminRoleGuard } from './admin-role.guard'; 
import { OrganizationsModule } from '../organizations/organizations.module';
import { EventsModule } from '../events/events.module';
import { GiftsModule } from '../gifts/gifts.module';
import { UsersModule } from '../users/users.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { Gift, GiftSchema } from '../gifts/schemas/gift.schema';
import { AuditLog, AuditLogSchema } from '../audit-log/schemas/audit-log.schema';

@Module({
  imports: [
    OrganizationsModule,
    EventsModule,
    GiftsModule,
    UsersModule,
    AuditLogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'changeme',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema },
      { name: Gift.name, schema: GiftSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminDashboardService,
    AdminAuthGuard,
    AdminRoleGuard,
  ],
  exports: [AdminService, AdminDashboardService],
})
export class AdminModule {}
