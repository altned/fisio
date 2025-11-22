import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Package } from '../../domain/entities/package.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { User } from '../../domain/entities/user.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SlotService } from './slot.service';

const SCHEDULABLE_STATUSES: Session['status'][] = ['SCHEDULED', 'PENDING_SCHEDULING'];

@Injectable()
export class BookingService {
  constructor(private readonly dataSource: DataSource, private readonly slotService: SlotService) {}

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
        status: 'PENDING',
        chatLockedAt: null,
      });

      const savedBooking = await bookingRepo.save(booking);

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
}
