import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Package } from '../../domain/entities/package.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { SlotService } from './slot.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Therapist, Package, Booking, Session, Wallet])],
  controllers: [BookingController],
  providers: [BookingService, SlotService],
  exports: [BookingService],
})
export class BookingModule {}
