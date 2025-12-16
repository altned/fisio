import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExpiryProcessor } from './processors/expiry.processor';
import { ChatLockProcessor } from './processors/chat-lock.processor';
import { TimeoutProcessor } from './processors/timeout.processor';
import { PayoutProcessor } from './processors/payout.processor';
import { PaymentExpiryProcessor } from './processors/payment-expiry.processor';
import { BookingCompleteProcessor } from './processors/booking-complete.processor';
import { BookingModule } from '../booking/booking.module';
import { WalletModule } from '../wallet/wallet.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notification/notification.module';
import { JobService } from './job.service';
import { QueueEventsListener } from './listeners/queue-events.listener';

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
      { name: 'payout' },
      { name: 'payment-expiry' },
      { name: 'booking-complete' },
    ),
    BookingModule,
    WalletModule,
    ChatModule,
    NotificationModule,
  ],
  providers: [
    ExpiryProcessor,
    ChatLockProcessor,
    TimeoutProcessor,
    PayoutProcessor,
    PaymentExpiryProcessor,
    BookingCompleteProcessor,
    JobService,
    QueueEventsListener,
  ],
})
export class JobModule { }

