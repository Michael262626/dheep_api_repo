import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gift, GiftSchema } from './schemas/gift.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gift.name, schema: GiftSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    AuditLogModule,
  ],
  controllers: [GiftsController],
  providers: [GiftsService],
  exports: [GiftsService],
})
export class GiftsModule {}