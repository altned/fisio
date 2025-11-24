import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TimeoutService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async handleTherapistTimeouts(): Promise<number> {
    const bookings = await this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.therapist', 't')
      .leftJoinAndSelect('t.user', 'u')
      .where('b.status = :status', { status: 'PAID' })
      .andWhere('b.therapist_respond_by IS NOT NULL')
      .andWhere('b.therapist_accepted_at IS NULL')
      .andWhere('b.therapist_respond_by < NOW()')
      .getMany();

    let count = 0;
    for (const booking of bookings) {
      booking.status = 'CANCELLED';
      booking.refundStatus = 'PENDING';
      await this.dataSource.getRepository(Booking).save(booking);
      count += 1;
      await this.notificationService.notifyBookingTimeout({
        therapistId: booking.therapist.id,
        title: 'Waktu respon habis',
        body: 'Booking dibatalkan, refund diproses',
        meta: { bookingId: booking.id },
      });
    }
    return count;
  }
}
