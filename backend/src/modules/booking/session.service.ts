import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';

const ONE_HOUR_MS = 60 * 60 * 1000;
const CHAT_LOCK_BUFFER_HOURS = 24;

@Injectable()
export class SessionService {
  constructor(private readonly dataSource: DataSource) {}

  async completeSession(sessionId: string): Promise<Session> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const bookingRepo = manager.getRepository(Booking);
      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking'],
      });
      if (!session) throw new BadRequestException('Session tidak ditemukan');
      if (session.status !== 'SCHEDULED') {
        throw new BadRequestException('Session tidak dalam status SCHEDULED');
      }

      session.status = 'COMPLETED';
      await sessionRepo.save(session);

      await this.updateChatLockIfFinished(bookingRepo, session.booking.id);
      return session;
    });
  }

  async cancelSession(sessionId: string): Promise<Session> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const bookingRepo = manager.getRepository(Booking);
      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking'],
      });
      if (!session) throw new BadRequestException('Session tidak ditemukan');
      if (session.status !== 'SCHEDULED') {
        throw new BadRequestException('Session tidak dalam status SCHEDULED');
      }
      if (!session.scheduledAt) {
        throw new BadRequestException('Session belum memiliki jadwal');
      }

      const now = new Date();
      const diff = session.scheduledAt.getTime() - now.getTime();
      if (diff > ONE_HOUR_MS) {
        // Aman: kembalikan kuota, jadwal dihapus
        session.status = 'PENDING_SCHEDULING';
        session.scheduledAt = null;
      } else {
        // Hangus: forfeit
        session.status = 'FORFEITED';
      }

      await sessionRepo.save(session);
      await this.updateChatLockIfFinished(bookingRepo, session.booking.id);
      return session;
    });
  }

  async expirePendingSessions(): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Session)
      .set({ status: 'EXPIRED' })
      .where(`status = 'PENDING_SCHEDULING'`)
      .andWhere(
        `booking_id IN (SELECT id FROM bookings WHERE created_at < NOW() - INTERVAL '30 days')`,
      )
      .execute();

    return result.affected ?? 0;
  }

  private async updateChatLockIfFinished(bookingRepo: Repository<Booking>, bookingId: string) {
    const booking = await bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['sessions'],
    });
    if (!booking || !booking.sessions?.length) return;

    const remaining = booking.sessions.filter(
      (s) => s.status === 'SCHEDULED' || s.status === 'PENDING_SCHEDULING',
    );
    if (remaining.length > 0) return;

    const completedSessions = booking.sessions.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'FORFEITED' || s.status === 'EXPIRED',
    );
    const latest = completedSessions
      .filter((s) => s.scheduledAt)
      .sort((a, b) => (a.scheduledAt!.getTime() > b.scheduledAt!.getTime() ? -1 : 1))[0];

    const baseTime = latest?.scheduledAt ?? new Date();
    booking.chatLockedAt = new Date(baseTime.getTime() + CHAT_LOCK_BUFFER_HOURS * 3600 * 1000);
    await bookingRepo.save(booking);
  }
}
