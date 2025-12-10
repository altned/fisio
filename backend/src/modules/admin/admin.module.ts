import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletTransaction } from '../../domain/entities/wallet-transaction.entity';
import { AdminActionLog } from '../../domain/entities/admin-action-log.entity';
import { Package } from '../../domain/entities/package.entity';
import { NotificationModule } from '../notification/notification.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { TherapistsController } from './therapists.controller';
import { TherapistsService } from './therapists.service';
import { RolesGuard, JwtGuard } from '../../common/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Session, Therapist, User, Wallet, WalletTransaction, AdminActionLog, Package]),
    NotificationModule,
    WalletModule,
  ],
  controllers: [AdminController, PackagesController, TherapistsController],
  providers: [AdminService, PackagesService, TherapistsService, RolesGuard, JwtGuard],
})
export class AdminModule { }


