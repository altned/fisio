import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class ChatLockService {
  constructor(private readonly dataSource: DataSource) {}

  async lockChats(): Promise<string[]> {
    const bookings = await this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('b')
      .select('b.id', 'id')
      .where('b.is_chat_active = true')
      .andWhere('b.chat_locked_at IS NOT NULL')
      .andWhere('b.chat_locked_at < NOW()')
      .getRawMany<{ id: string }>();

    const ids = bookings.map((b) => b.id);
    if (ids.length === 0) return [];

    await this.dataSource
      .createQueryBuilder()
      .update(Booking)
      .set({ isChatActive: false })
      .where('id IN (:...ids)', { ids })
      .execute();

    return ids;
  }
}
