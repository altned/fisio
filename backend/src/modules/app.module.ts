import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../domain/entities/booking.entity';
import { Package } from '../domain/entities/package.entity';
import { Review } from '../domain/entities/review.entity';
import { Session } from '../domain/entities/session.entity';
import { Therapist } from '../domain/entities/therapist.entity';
import { User } from '../domain/entities/user.entity';
import { Wallet } from '../domain/entities/wallet.entity';
import { WalletTransaction } from '../domain/entities/wallet-transaction.entity';
import { BookingModule } from './booking/booking.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { WalletModule } from './wallet/wallet.module';
import { AppController } from '../presentation/app.controller';
import { AppService } from '../services/app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Therapist, Package, Booking, Session, Wallet, WalletTransaction, Review],
      synchronize: false,
      autoLoadEntities: true,
    }),
    BookingModule,
    AdminModule,
    PaymentModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
