import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { CompleteRefundDto } from './dto/complete-refund.dto';

@Injectable()
export class AdminService {
  constructor(private readonly dataSource: DataSource) {}

  async completeRefund(input: CompleteRefundDto): Promise<Booking> {
    const repo = this.dataSource.getRepository(Booking);
    const booking = await repo.findOne({ where: { id: input.bookingId } });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    if (booking.status !== 'CANCELLED') throw new BadRequestException('Booking belum dibatalkan');
    if (booking.refundStatus === 'COMPLETED') return booking;

    booking.refundStatus = 'COMPLETED';
    booking.refundReference = input.refundReference ?? null;
    booking.refundNote = input.refundNote ?? null;
    booking.refundedAt = new Date();
    return repo.save(booking);
  }
}
