import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingModule } from '../booking/booking.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), forwardRef(() => BookingModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
