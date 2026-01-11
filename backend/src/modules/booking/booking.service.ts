import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking, BookingType } from '../../domain/entities/booking.entity';
import { Package } from '../../domain/entities/package.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { NotificationService } from '../notification/notification.service';
import { ChatService } from '../chat/chat.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RespondBookingDto } from './dto/respond-booking.dto';
import { SearchBookingDto } from './dto/search-booking.dto';
import { SlotService } from './slot.service';

const SCHEDULABLE_STATUSES: Session['status'][] = ['SCHEDULED', 'PENDING_SCHEDULING'];
const CHAT_LOCK_BUFFER_HOURS = 24;

@Injectable()
export class BookingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly slotService: SlotService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) { }

  async createBooking(input: CreateBookingDto): Promise<Booking> {
    this.validateSlot(input);
    this.validateConsent(input);

    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const userRepo = manager.getRepository(User);
      const therapistRepo = manager.getRepository(Therapist);
      const packageRepo = manager.getRepository(Package);
      const bookingRepo = manager.getRepository(Booking);
      const sessionRepo = manager.getRepository(Session);
      const walletRepo = manager.getRepository(Wallet);

      const user = await userRepo.findOne({ where: { id: input.userId } });
      if (!user) throw new BadRequestException('User tidak ditemukan');
      if (!user.isProfileComplete) throw new BadRequestException('Profil belum lengkap');

      const therapist = await therapistRepo.findOne({
        where: { id: input.therapistId },
        relations: ['user'],
      });
      if (!therapist) throw new BadRequestException('Terapis tidak ditemukan');

      let pkg: Package | null = null;
      if (input.packageId) {
        pkg = await packageRepo.findOne({ where: { id: input.packageId } });
        if (!pkg) throw new BadRequestException('Paket tidak ditemukan');
      }

      await this.assertSlotAvailability(sessionRepo, therapist.id, input.scheduledAt);

      const sessionCount = pkg?.sessionCount ?? 1;

      // Calculate pricing from package
      const totalPrice = input.totalPrice || pkg?.totalPrice || '0';

      // Commission rate from package (percentage), default to 30% if not set
      const commissionRatePercent = pkg?.commissionRate ? Number(pkg.commissionRate) : 30;
      const adminFeeRate = commissionRatePercent / 100; // Convert to decimal (e.g., 30% → 0.3)

      const adminFeeAmount = input.adminFeeAmount || (parseFloat(totalPrice) * adminFeeRate).toFixed(2);
      const therapistNetTotal = input.therapistNetTotal || (parseFloat(totalPrice) - parseFloat(adminFeeAmount)).toFixed(2);

      const booking = bookingRepo.create({
        user,
        therapist,
        package: pkg ?? undefined,
        lockedAddress: input.lockedAddress,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        totalPrice: totalPrice,
        adminFeeAmount: adminFeeAmount,
        therapistNetTotal: therapistNetTotal,
        bookingType: input.bookingType,
        status: 'PENDING',
        chatLockedAt: null,
        // Consent fields
        consentService: input.consentService,
        consentDataSharing: input.consentDataSharing,
        consentTerms: input.consentTerms,
        consentMedicalDisclaimer: input.consentMedicalDisclaimer,
        consentVersion: '1.0',
        consentedAt: new Date(),
      });

      const savedBooking = await bookingRepo.save(booking);



      if (input.bookingType === 'INSTANT') {
        await this.notificationService.notifyTherapistInstantBooking({
          therapistId: therapist.id,
          deviceToken: therapist.user?.fcmToken ?? undefined,
          title: 'Permintaan Instan',
          body: 'Booking instan menunggu respon Anda',
          meta: { bookingId: savedBooking.id },
        });
      }

      await this.chatService.openRoom(savedBooking.id, [user.id, therapist.id]);

      const sessions: Session[] = [];
      for (let i = 0; i < sessionCount; i++) {
        const isFirst = i === 0;
        const session = sessionRepo.create({
          booking: savedBooking,
          therapist,
          sequenceOrder: i + 1,
          scheduledAt: isFirst ? input.scheduledAt : null,
          status: isFirst ? 'SCHEDULED' : 'PENDING_SCHEDULING',
        });
        sessions.push(session);
      }
      await sessionRepo.save(sessions);

      await this.ensureWallet(walletRepo, therapist);

      return savedBooking;
    });
  }

  private validateSlot(input: CreateBookingDto) {
    if (!this.slotService.isSlotAligned(input.scheduledAt)) {
      throw new BadRequestException('Slot harus pada menit :00 atau :30');
    }

    if (input.bookingType === 'INSTANT' && !this.slotService.hasValidLeadTime(input.scheduledAt)) {
      throw new BadRequestException('Instant booking harus memiliki lead time > 60 menit');
    }
  }

  private validateConsent(input: CreateBookingDto) {
    if (!input.consentService) {
      throw new BadRequestException('Persetujuan layanan wajib diberikan');
    }
    if (!input.consentDataSharing) {
      throw new BadRequestException('Persetujuan berbagi data wajib diberikan');
    }
    if (!input.consentTerms) {
      throw new BadRequestException('Persetujuan syarat & ketentuan wajib diberikan');
    }
    if (!input.consentMedicalDisclaimer) {
      throw new BadRequestException('Persetujuan disclaimer medis wajib diberikan');
    }
  }


  private async assertSlotAvailability(sessionRepo: Repository<Session>, therapistId: string, scheduledAt: Date) {
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


  private async ensureWallet(walletRepo: Repository<Wallet>, therapist: Therapist) {
    const existing = await walletRepo.findOne({
      where: { therapist: { id: therapist.id } },
      relations: ['therapist'],
    });
    if (existing) return existing;
    const wallet = walletRepo.create({ therapist, balance: '0' });
    return walletRepo.save(wallet);
  }

  computeChatLockAt(scheduledAt: Date): Date {
    return new Date(scheduledAt.getTime() + CHAT_LOCK_BUFFER_HOURS * 3600 * 1000);
  }

  private setChatLockForFirstSession(booking: Booking, firstSession: Session) {
    if (!firstSession.scheduledAt) return booking;
    booking.chatLockedAt = this.computeChatLockAt(firstSession.scheduledAt);
    return booking;
  }

  async acceptBooking(input: RespondBookingDto): Promise<Booking> {
    const bookingRepo = this.dataSource.getRepository(Booking);
    const sessionRepo = this.dataSource.getRepository(Session);

    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.getRepository(Booking).findOne({
        where: { id: input.bookingId },
        relations: ['therapist', 'therapist.user', 'user'],
      });
      if (!booking) throw new BadRequestException('Booking tidak ditemukan');
      if (booking.therapist.id !== input.therapistId) {
        throw new BadRequestException('Terapis tidak sesuai');
      }
      if (booking.status !== 'PAID') throw new BadRequestException('Booking belum dibayar atau sudah selesai');
      if (booking.therapistRespondBy && new Date() > booking.therapistRespondBy) {
        booking.status = 'CANCELLED';
        await manager.getRepository(Booking).save(booking);
        throw new BadRequestException('Waktu respon terapis habis');
      }

      booking.therapistAcceptedAt = new Date();
      const firstSession = await sessionRepo.findOne({
        where: { booking: { id: booking.id }, sequenceOrder: 1 },
      });
      if (firstSession) {
        this.setChatLockForFirstSession(booking, firstSession);
      }

      const saved = await manager.getRepository(Booking).save(booking);
      await this.notificationService.notifyBookingAccepted({
        therapistId: booking.therapist.id,
        deviceToken: booking.therapist.user?.fcmToken ?? undefined,
        title: 'Booking diterima',
        body: 'Booking telah Anda terima',
        meta: { bookingId: booking.id },
      });
      await this.notificationService.notifyBookingAccepted({
        userId: booking.user.id,
        deviceToken: booking.user?.fcmToken ?? undefined,
        title: 'Booking diterima',
        body: 'Terapis Anda menerima booking',
        meta: { bookingId: booking.id },
      });
      await this.chatService.openRoom(booking.id);
      return saved;
    });
  }

  async declineBooking(input: RespondBookingDto): Promise<Booking> {
    const bookingRepo = this.dataSource.getRepository(Booking);
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.getRepository(Booking).findOne({
        where: { id: input.bookingId },
        relations: ['therapist', 'therapist.user'],
      });
      if (!booking) throw new BadRequestException('Booking tidak ditemukan');
      if (booking.therapist.id !== input.therapistId) {
        throw new BadRequestException('Terapis tidak sesuai');
      }
      if (booking.status !== 'PAID') throw new BadRequestException('Booking belum dibayar atau sudah selesai');

      booking.status = 'CANCELLED';
      booking.refundStatus = 'PENDING';
      const saved = await manager.getRepository(Booking).save(booking);
      await this.notificationService.notifyBookingDeclined({
        therapistId: booking.therapist.id,
        deviceToken: booking.therapist.user?.fcmToken ?? undefined,
        title: 'Booking ditolak',
        body: 'Booking ditolak dan menunggu refund',
        meta: { bookingId: booking.id },
      });
      await this.notificationService.notifyBookingDeclined({
        userId: booking.user.id,
        title: 'Booking dibatalkan',
        body: 'Booking dibatalkan oleh terapis, refund diproses',
        meta: { bookingId: booking.id },
      });
      return saved;
    });
  }

  computeRespondBy(bookingType: BookingType): Date {
    const now = new Date();
    // INSTANT: 5 minutes, REGULAR: 1 hour
    const minutes = bookingType === 'INSTANT' ? 5 : 60; // 5min vs 1h
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  async search(filter: SearchBookingDto) {
    const repo = this.dataSource.getRepository(Booking);
    const page = Math.max(filter.page ?? 1, 1);
    const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);

    const qb = repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'user')
      .leftJoinAndSelect('b.therapist', 'therapist')
      .leftJoinAndSelect('therapist.user', 'therapistUser')
      .leftJoinAndSelect('b.package', 'package')
      .orderBy('b.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (filter.therapistId) {
      qb.andWhere('b.therapist = :tid', { tid: filter.therapistId });
    }
    if (filter.userId) {
      qb.andWhere('b.user = :uid', { uid: filter.userId });
    }
    if (filter.status) {
      qb.andWhere('b.status = :status', { status: filter.status });
    }
    if (filter.paymentStatus) {
      qb.andWhere('b.paymentStatus = :pstatus', { pstatus: filter.paymentStatus });
    }
    if (filter.from) {
      qb.andWhere('b.createdAt >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('b.createdAt <= :to', { to: filter.to });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, page, limit, total };
  }

  async getMyBookings(userId: string, role: 'PATIENT' | 'THERAPIST') {
    const repo = this.dataSource.getRepository(Booking);

    const qb = repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'user')
      .leftJoinAndSelect('b.therapist', 'therapist')
      .leftJoinAndSelect('therapist.user', 'therapistUser')
      .leftJoinAndSelect('b.package', 'package')
      .leftJoinAndSelect('b.sessions', 'session')
      .orderBy('b.createdAt', 'DESC')
      .addOrderBy('session.sequenceOrder', 'ASC');

    if (role === 'PATIENT') {
      qb.where('b.user = :userId', { userId });
    } else {
      // THERAPIST - find therapist record by user id
      const therapistRepo = this.dataSource.getRepository(Therapist);
      const therapist = await therapistRepo.findOne({ where: { user: { id: userId } } });
      if (!therapist) {
        return [];
      }
      qb.where('b.therapist = :therapistId', { therapistId: therapist.id });
    }

    return qb.getMany();
  }

  async getDetail(bookingId: string, requesterId?: string, requesterRole?: string) {
    const repo = this.dataSource.getRepository(Booking);
    const booking = await repo.findOne({
      where: { id: bookingId },
      relations: ['user', 'therapist', 'therapist.user', 'package', 'sessions'],
      order: { sessions: { sequenceOrder: 'ASC' } as any },
    });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');

    // Ownership check for non-admin
    if (requesterRole && requesterRole !== 'ADMIN' && requesterId) {
      const isPatientOwner = requesterRole === 'PATIENT' && booking.user.id === requesterId;
      const isTherapistOwner = requesterRole === 'THERAPIST' && booking.therapist.user?.id === requesterId;

      if (!isPatientOwner && !isTherapistOwner) {
        throw new ForbiddenException('Anda tidak memiliki akses ke booking ini');
      }
    }

    // Check if review already exists for this booking
    const reviewRepo = this.dataSource.getRepository('reviews');
    const reviewCount = await reviewRepo.count({ where: { booking: { id: bookingId } } });

    return {
      ...booking,
      hasReviewed: reviewCount > 0,
    };
  }

  /**
   * Cancel a session. If <1 hour before scheduled time, mark as FORFEITED and therapist still gets paid.
   * If >1 hour before, mark as CANCELLED and return quota.
   */
  async cancelSession(sessionId: string, userId: string, reason?: string): Promise<Session> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const bookingRepo = manager.getRepository(Booking);

      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking', 'booking.user', 'booking.therapist', 'booking.therapist.user', 'therapist'],
      });
      if (!session) throw new BadRequestException('Sesi tidak ditemukan');

      // Only booking owner can cancel
      if (session.booking.user.id !== userId) {
        throw new ForbiddenException('Anda tidak dapat membatalkan sesi ini');
      }

      // Can only cancel SCHEDULED sessions
      if (session.status !== 'SCHEDULED') {
        throw new BadRequestException('Sesi tidak dapat dibatalkan (status: ' + session.status + ')');
      }

      const now = new Date();
      const scheduledAt = session.scheduledAt;
      if (!scheduledAt) {
        throw new BadRequestException('Sesi belum dijadwalkan');
      }

      const hoursUntilSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Set cancellation tracking fields
      session.cancellationReason = reason || null;
      session.cancelledAt = now;
      session.cancelledBy = 'PATIENT';

      if (hoursUntilSession < 1) {
        // FORFEIT: <1 hour before session - therapist still gets paid
        session.status = 'FORFEITED';
        await sessionRepo.save(session);

        // Notify therapist about forfeited session
        const reasonText = reason ? ` Alasan: ${reason}` : '';
        await this.notificationService.notifyPayoutSuccess({
          therapistId: session.therapist.id,
          deviceToken: session.booking.therapist.user?.fcmToken ?? undefined,
          title: 'Sesi Di-forfeit',
          body: `Pasien membatalkan <1 jam sebelum sesi. Anda tetap mendapat payout.${reasonText}`,
          meta: { sessionId: session.id, bookingId: session.booking.id },
        });
      } else {
        // SAFE CANCEL: >1 hour before session - restore quota
        session.status = 'PENDING_SCHEDULING';
        session.scheduledAt = null;
        await sessionRepo.save(session);

        // Notify therapist about cancellation
        const reasonText = reason ? ` Alasan: ${reason}` : '';
        await this.notificationService.notifySwapTherapist({
          therapistId: session.therapist.id,
          deviceToken: session.booking.therapist.user?.fcmToken ?? undefined,
          title: 'Sesi Dibatalkan',
          body: `Pasien membatalkan jadwal sesi.${reasonText}`,
          meta: { sessionId: session.id, bookingId: session.booking.id },
        });
      }

      return session;
    });
  }

  /**
   * Mark a session as COMPLETED. Triggers payout to therapist.
   */
  async completeSession(sessionId: string, userId: string, therapistNotes?: string): Promise<Session> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const therapistRepo = manager.getRepository(Therapist);

      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking', 'booking.user', 'booking.therapist', 'booking.therapist.user', 'therapist'],
      });
      if (!session) throw new BadRequestException('Sesi tidak ditemukan');

      // Get therapist by user ID
      const therapist = await therapistRepo.findOne({ where: { user: { id: userId } } });
      if (!therapist || therapist.id !== session.therapist.id) {
        throw new ForbiddenException('Hanya terapis yang ditugaskan yang dapat menyelesaikan sesi');
      }

      // Can only complete SCHEDULED sessions
      if (session.status !== 'SCHEDULED') {
        throw new BadRequestException('Sesi tidak dapat diselesaikan (status: ' + session.status + ')');
      }

      session.status = 'COMPLETED';
      if (therapistNotes) {
        session.therapistNotes = therapistNotes;
      }
      await sessionRepo.save(session);

      // Notify patient about completed session
      await this.notificationService.notifySwapTherapist({
        userId: session.booking.user.id,
        title: 'Sesi Selesai',
        body: 'Terapis telah menyelesaikan sesi Anda. Silakan berikan review.',
        meta: { sessionId: session.id, bookingId: session.booking.id },
      });

      return session;
    });
  }
}

