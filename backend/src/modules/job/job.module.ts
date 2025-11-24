import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExpiryProcessor } from './processors/expiry.processor';
import { ChatLockProcessor } from './processors/chat-lock.processor';
import { TimeoutProcessor } from './processors/timeout.processor';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'booking-expiry' },
      { name: 'chat-lock' },
      { name: 'therapist-timeout' },
    ),
    BookingModule,
  ],
  providers: [ExpiryProcessor, ChatLockProcessor, TimeoutProcessor],
})
export class JobModule {}
