import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class TimeoutService {
  constructor(private readonly dataSource: DataSource) {}

  async handleTherapistTimeouts(): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Booking)
      .set({ status: 'CANCELLED', refundStatus: 'PENDING' })
      .where('status = :status', { status: 'PAID' })
      .andWhere('therapist_respond_by IS NOT NULL')
      .andWhere('therapist_accepted_at IS NULL')
      .andWhere('therapist_respond_by < NOW()')
      .execute();
    return result.affected ?? 0;
  }
}
