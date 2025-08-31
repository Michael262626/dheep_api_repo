import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Gift, GiftSchema } from '../gifts/schemas/gift.schema';
import { EventsService } from './events.service';
import { EventParticipationService } from './event-participation.service';
import { EventsController } from './events.controller';
import { EventParticipationController } from './event-participation.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: User.name, schema: UserSchema },
      { name: Gift.name, schema: GiftSchema },
    ]),
    AuditLogModule,
  ],
  controllers: [EventsController, EventParticipationController],
  providers: [EventsService, EventParticipationService],
  exports: [EventsService, EventParticipationService],
})
export class EventsModule {}