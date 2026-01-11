import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { UserRole } from '../../domain/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { SlotService } from './slot.service';

const ONE_HOUR_MS = 60 * 60 * 1000;
const CHAT_LOCK_BUFFER_HOURS = 24;
const SCHEDULABLE_STATUSES: Session['status'][] = ['SCHEDULED', 'PENDING_SCHEDULING'];

@Injectable()
export class SessionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
    private readonly slotService: SlotService,
    @InjectQueue('payout') private readonly payoutQueue: Queue,
  ) { }

  async completeSession(sessionId: string, notes: string, photoUrl?: string): Promise<Session> {
    if (!notes?.trim()) {
      throw new BadRequestException('Catatan sesi wajib diisi');
    }

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
      session.therapistNotes = notes.trim();
      if (photoUrl) {
        session.completionPhotoUrl = photoUrl;
      }
      await sessionRepo.save(session);

      await this.updateChatLockIfFinished(bookingRepo, session.booking.id);
      await this.enqueuePayout(session.id);
      return session;
    });
  }

  async cancelSession(
    sessionId: string,
    reason?: string,
    cancelledBy: 'PATIENT' | 'THERAPIST' | 'SYSTEM' = 'PATIENT',
  ): Promise<Session> {
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

      // Set cancellation tracking
      session.cancellationReason = reason || null;
      session.cancelledAt = now;
      session.cancelledBy = cancelledBy;

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

      if (session.status === 'FORFEITED') {
        await this.enqueuePayout(session.id);
      }
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

  async schedulePendingSession(
    sessionId: string,
    scheduledAt: Date,
    actor?: { id?: string; role?: UserRole },
  ): Promise<Session> {
    if (!this.slotService.isSlotAligned(scheduledAt)) {
      throw new BadRequestException('Slot harus pada menit :00 atau :30');
    }
    if (!this.slotService.hasValidLeadTime(scheduledAt)) {
      throw new BadRequestException('Slot harus memiliki lead time > 60 menit');
    }

    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking', 'booking.therapist', 'booking.user'],
      });
      if (!session) throw new BadRequestException('Session tidak ditemukan');
      if (session.status !== 'PENDING_SCHEDULING') {
        throw new BadRequestException('Session tidak dapat dijadwalkan');
      }

      if (actor?.role === 'PATIENT' && actor.id && session.booking.user.id !== actor.id) {
        throw new ForbiddenException('Tidak boleh menjadwalkan booking milik pengguna lain');
      }

      await this.assertSlotAvailability(sessionRepo, session.booking.therapist.id, scheduledAt);

      session.scheduledAt = scheduledAt;
      session.status = 'SCHEDULED';
      session.therapist = session.booking.therapist; // enforce locked therapist

      return sessionRepo.save(session);
    });
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

    // All sessions are finished - mark booking as COMPLETED
    const completedSessions = booking.sessions.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'FORFEITED' || s.status === 'EXPIRED',
    );
    const latest = completedSessions
      .filter((s) => s.scheduledAt)
      .sort((a, b) => (a.scheduledAt!.getTime() > b.scheduledAt!.getTime() ? -1 : 1))[0];

    const baseTime = latest?.scheduledAt ?? new Date();
    booking.chatLockedAt = new Date(baseTime.getTime() + CHAT_LOCK_BUFFER_HOURS * 3600 * 1000);

    // Update booking status to COMPLETED if still PAID
    if (booking.status === 'PAID') {
      booking.status = 'COMPLETED';
    }

    await bookingRepo.save(booking);
  }

  private async enqueuePayout(sessionId: string) {
    await this.payoutQueue.add(
      'run',
      { sessionId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  private async assertSlotAvailability(
    sessionRepo: Repository<Session>,
    therapistId: string,
    scheduledAt: Date,
  ) {
    const { start, end } = this.slotService.slotWindow(scheduledAt);
    // Use getMany() instead of getCount() because PostgreSQL doesn't allow FOR UPDATE with aggregate functions
    const overlapping = await sessionRepo
      .createQueryBuilder('session')
      .setLock('pessimistic_write')
      .where('session.therapist_id = :therapistId', { therapistId })
      .andWhere('session.status IN (:...statuses)', { statuses: SCHEDULABLE_STATUSES })
      .andWhere('session.scheduled_at BETWEEN :start AND :end', { start, end })
      .getMany();

    if (overlapping.length > 0) {
      throw new BadRequestException('Slot tidak tersedia (double booking)');
    }
  }

  /**
   * Get busy time slots for a therapist within a date range
   * Returns array of ISO date strings representing booked slot start times
   */
  async getBusySlots(
    therapistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string[]> {
    const sessionRepo = this.dataSource.getRepository(Session);

    const sessions = await sessionRepo
      .createQueryBuilder('session')
      .select('session.scheduled_at', 'scheduledAt')
      .where('session.therapist_id = :therapistId', { therapistId })
      .andWhere('session.status IN (:...statuses)', { statuses: SCHEDULABLE_STATUSES })
      .andWhere('session.scheduled_at >= :startDate', { startDate })
      .andWhere('session.scheduled_at <= :endDate', { endDate })
      .getRawMany<{ scheduledAt: Date }>();

    return sessions
      .filter(s => s.scheduledAt)
      .map(s => s.scheduledAt.toISOString());
  }

  /**
   * Swap therapist for a pending session
   * Only allowed for PENDING_SCHEDULING sessions
   */
  async swapTherapist(
    sessionId: string,
    newTherapistId: string,
    actor?: { id?: string; role?: UserRole },
  ): Promise<Session> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking', 'booking.user', 'booking.therapist', 'therapist'],
      });

      if (!session) {
        throw new BadRequestException('Session tidak ditemukan');
      }

      if (session.status !== 'PENDING_SCHEDULING') {
        throw new BadRequestException('Hanya sesi dengan status PENDING_SCHEDULING yang dapat diganti terapisnya');
      }

      // Verify actor is the patient who owns this booking
      if (actor?.role === 'PATIENT' && actor.id && session.booking.user.id !== actor.id) {
        throw new ForbiddenException('Tidak boleh mengganti terapis untuk booking milik pengguna lain');
      }

      // Load the new therapist
      const therapistRepo = manager.getRepository('Therapist');
      const newTherapist = await therapistRepo.findOne({
        where: { id: newTherapistId },
        relations: ['user'],
      });

      if (!newTherapist) {
        throw new BadRequestException('Terapis baru tidak ditemukan');
      }

      // Update session therapist
      session.therapist = newTherapist as any;

      // Also update the booking's therapist for future sessions
      const bookingRepo = manager.getRepository(Booking);
      const booking = await bookingRepo.findOne({
        where: { id: session.booking.id },
      });
      if (booking) {
        booking.therapist = newTherapist as any;
        await bookingRepo.save(booking);
      }

      return sessionRepo.save(session);
    });
  }
}

