import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletTransaction } from '../../domain/entities/wallet-transaction.entity';
import { NotificationModule } from '../notification/notification.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Session, Therapist, Wallet, WalletTransaction]),
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
