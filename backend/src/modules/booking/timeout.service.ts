import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TimeoutService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) { }

  async handleTherapistTimeouts(): Promise<number> {
    const bookings = await this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.therapist', 't')
      .leftJoinAndSelect('t.user', 'tu')
      .leftJoinAndSelect('b.user', 'u')
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
      await this.notificationService.notifyBookingTimeout({
        userId: booking.user.id,
        title: 'Booking dibatalkan',
        body: 'Terapis tidak merespons, refund diproses',
        meta: { bookingId: booking.id },
      });
    }
    return count;
  }

  /**
   * Cancel bookings where payment expiry time has passed
   * This releases the booked time slots for other patients
   */
  async handlePaymentExpiry(): Promise<number> {
    const bookings = await this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.sessions', 's')
      .leftJoinAndSelect('b.user', 'u')
      .where('b.payment_status = :paymentStatus', { paymentStatus: 'PENDING' })
      .andWhere('b.payment_expiry_time IS NOT NULL')
      .andWhere('b.payment_expiry_time < NOW()')
      .getMany();

    let count = 0;
    const bookingRepo = this.dataSource.getRepository(Booking);
    const sessionRepo = this.dataSource.getRepository(Session);

    for (const booking of bookings) {
      // Cancel the booking
      booking.status = 'CANCELLED';
      booking.paymentStatus = 'EXPIRED';
      await bookingRepo.save(booking);

      // Release all sessions (slots) by setting them to CANCELLED
      if (booking.sessions?.length) {
        for (const session of booking.sessions) {
          if (session.status === 'SCHEDULED' || session.status === 'PENDING_SCHEDULING') {
            session.status = 'EXPIRED';
            await sessionRepo.save(session);
          }
        }
      }

      // Notify patient
      await this.notificationService.notifyBookingTimeout({
        userId: booking.user.id,
        title: 'Pembayaran kedaluwarsa',
        body: 'Waktu pembayaran habis, booking dibatalkan',
        meta: { bookingId: booking.id },
      });

      count += 1;
    }

    return count;
  }
}
