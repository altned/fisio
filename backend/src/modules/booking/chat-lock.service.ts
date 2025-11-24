import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';

@Injectable()
export class ChatLockService {
  constructor(private readonly dataSource: DataSource) {}

  async lockChats(): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Booking)
      .set({ isChatActive: false })
      .where('is_chat_active = true')
      .andWhere('chat_locked_at IS NOT NULL')
      .andWhere('chat_locked_at < NOW()')
      .execute();
    return result.affected ?? 0;
  }
}
