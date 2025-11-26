import { Injectable, BadRequestException } from '@nestjs/common';
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
  ) {}

  async createBooking(input: CreateBookingDto): Promise<Booking> {
    this.validateSlot(input);

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
      const booking = bookingRepo.create({
        user,
        therapist,
        package: pkg ?? undefined,
        lockedAddress: input.lockedAddress,
        totalPrice: input.totalPrice,
        adminFeeAmount: input.adminFeeAmount,
        therapistNetTotal: input.therapistNetTotal,
        bookingType: input.bookingType,
        status: 'PENDING',
        chatLockedAt: null,
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

  private async assertSlotAvailability(sessionRepo: Repository<Session>, therapistId: string, scheduledAt: Date) {
    const { start, end } = this.slotService.slotWindow(scheduledAt);
    const overlapping = await sessionRepo
      .createQueryBuilder('session')
      .setLock('pessimistic_write')
      .where('session.therapist_id = :therapistId', { therapistId })
      .andWhere('session.status IN (:...statuses)', { statuses: SCHEDULABLE_STATUSES })
      .andWhere('session.scheduled_at BETWEEN :start AND :end', { start, end })
      .getCount();

    if (overlapping > 0) {
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
    const minutes = bookingType === 'INSTANT' ? 5 : 30;
    return new Date(now.getTime() + minutes * 60 * 1000);
  }
}
