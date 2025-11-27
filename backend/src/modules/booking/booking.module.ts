import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Package } from '../../domain/entities/package.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { SlotService } from './slot.service';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { TimeoutService } from './timeout.service';
import { ChatLockService } from './chat-lock.service';
import { NotificationModule } from '../notification/notification.module';
import { ChatModule } from '../chat/chat.module';
import { RolesGuard, JwtGuard } from '../../common/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Therapist, Package, Booking, Session, Wallet]),
    WalletModule,
    NotificationModule,
    ChatModule,
    BullModule.registerQueue({ name: 'payout' }),
  ],
  controllers: [BookingController, SessionController],
  providers: [
    BookingService,
    SlotService,
    SessionService,
    TimeoutService,
    ChatLockService,
    RolesGuard,
    JwtGuard,
  ],
  exports: [BookingService, SessionService, TimeoutService, ChatLockService],
})
export class BookingModule {}
