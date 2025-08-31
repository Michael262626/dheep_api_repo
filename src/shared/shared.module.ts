import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';

@Module({
  imports: [ConfigModule], // Import ConfigModule to use ConfigService
  providers: [SmsService],
  exports: [SmsService], // Export SmsService so other modules can use it
})
export class SharedModule {}
