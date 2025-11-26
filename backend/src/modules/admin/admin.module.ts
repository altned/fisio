import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletTransaction } from '../../domain/entities/wallet-transaction.entity';
import { AdminActionLog } from '../../domain/entities/admin-action-log.entity';
import { NotificationModule } from '../notification/notification.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Session, Therapist, Wallet, WalletTransaction, AdminActionLog]),
    NotificationModule,
    WalletModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
