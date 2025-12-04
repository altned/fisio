import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { BookingModule } from '../booking/booking.module';
import { NotificationModule } from '../notification/notification.module';
import { RolesGuard, JwtGuard } from '../../common/auth';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MidtransWebhookController } from './midtrans-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), forwardRef(() => BookingModule), NotificationModule],
  controllers: [PaymentController, MidtransWebhookController],
  providers: [PaymentService, RolesGuard, JwtGuard],
})
export class PaymentModule {}
