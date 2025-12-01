import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { WalletTransaction } from '../../domain/entities/wallet-transaction.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { AdminActionLog } from '../../domain/entities/admin-action-log.entity';
import { NotificationService } from '../notification/notification.service';
import { WalletService } from '../wallet/wallet.service';
import { ManualPayoutDto } from './dto/manual-payout.dto';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { SwapTherapistDto } from './dto/swap-therapist.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TopupDto } from './dto/topup.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly walletService: WalletService,
  ) {}

  async completeRefund(input: CompleteRefundDto, adminId?: string): Promise<Booking> {
    const repo = this.dataSource.getRepository(Booking);
    const booking = await repo.findOne({ where: { id: input.bookingId } });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    if (booking.status !== 'CANCELLED') throw new BadRequestException('Booking belum dibatalkan');
    if (booking.refundStatus === 'COMPLETED') return booking;

    booking.refundStatus = 'COMPLETED';
    booking.refundReference = input.refundReference ?? null;
    booking.refundNote = input.refundNote ?? null;
    booking.refundedAt = new Date();
    const saved = await repo.save(booking);
    await this.logAdminAction(adminId, 'REFUND_COMPLETED', 'booking', booking.id, {
      refundReference: booking.refundReference,
      refundNote: booking.refundNote,
    });
    return saved;
  }

  async swapTherapist(input: SwapTherapistDto, adminId?: string): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const sessionRepo = manager.getRepository(Session);
      const therapistRepo = manager.getRepository(Therapist);

      const booking = await bookingRepo.findOne({
        where: { id: input.bookingId },
        relations: ['therapist', 'therapist.user', 'user'],
      });
      if (!booking) throw new BadRequestException('Booking tidak ditemukan');

      const newTherapist = await therapistRepo.findOne({
        where: { id: input.newTherapistId },
        relations: ['user'],
      });
      if (!newTherapist) throw new BadRequestException('Terapis baru tidak ditemukan');

      const oldTherapist = booking.therapist;

      booking.therapist = newTherapist;

      await sessionRepo
        .createQueryBuilder()
        .update(Session)
        .set({ therapist: newTherapist })
        .where('booking_id = :bookingId', { bookingId: booking.id })
        .andWhere('status IN (:...statuses)', { statuses: ['PENDING_SCHEDULING', 'SCHEDULED'] })
        .execute();

      await this.notificationService.notifySwapTherapist({
        therapistId: newTherapist.id,
        deviceToken: newTherapist.user?.fcmToken ?? undefined,
        title: 'Booking diperbarui',
        body: 'Anda ditugaskan ke booking baru',
        meta: { bookingId: booking.id },
      });

      await this.notificationService.notifySwapTherapist({
        therapistId: oldTherapist.id,
        deviceToken: oldTherapist.user?.fcmToken ?? undefined,
        title: 'Booking dialihkan',
        body: 'Booking dialihkan ke terapis lain',
        meta: { bookingId: booking.id },
      });

      await this.notificationService.notifySwapTherapist({
        userId: booking.user.id,
        title: 'Terapis diganti',
        body: 'Booking Anda dialihkan ke terapis baru',
        meta: { bookingId: booking.id },
      });

      const saved = await bookingRepo.save(booking);
      await this.logAdminAction(adminId, 'SWAP_THERAPIST', 'booking', booking.id, {
        fromTherapistId: oldTherapist.id,
        toTherapistId: newTherapist.id,
      });
      return saved;
    });
  }

  async withdraw(dto: WithdrawDto, adminId?: string): Promise<WalletTransaction> {
    if (!dto.adminNote || dto.adminNote.trim().length === 0) {
      throw new BadRequestException('admin_note wajib diisi');
    }
    const amount = Number(dto.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Amount tidak valid');
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(WalletTransaction);

      const wallet = await walletRepo.findOne({ where: { id: dto.walletId } });
      if (!wallet) throw new BadRequestException('Wallet tidak ditemukan');

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Saldo tidak mencukupi');
      }

      wallet.balance = (Number(wallet.balance) - amount).toFixed(2);

      const tx = txRepo.create({
        wallet,
        amount: amount.toFixed(2),
        type: 'DEBIT',
        category: 'WITHDRAWAL',
        adminNote: dto.adminNote,
      });

      await walletRepo.save(wallet);
      const savedTx = await txRepo.save(tx);
      await this.logAdminAction(adminId, 'WITHDRAW', 'wallet', wallet.id, {
        amount: tx.amount,
        adminNote: tx.adminNote,
      });
      return savedTx;
    });
  }

  async manualPayout(dto: ManualPayoutDto, adminId?: string): Promise<void> {
    if (!dto.adminNote || dto.adminNote.trim().length === 0) {
      throw new BadRequestException('admin_note wajib diisi');
    }
    await this.walletService.payoutSession(dto.sessionId, { adminNote: dto.adminNote });
    await this.logAdminAction(adminId, 'MANUAL_PAYOUT', 'session', dto.sessionId, {
      adminNote: dto.adminNote,
    });
  }

  async topUpWallet(dto: TopupDto, adminId?: string): Promise<WalletTransaction> {
    if (!dto.adminNote || dto.adminNote.trim().length === 0) {
      throw new BadRequestException('admin_note wajib diisi');
    }
    const amount = Number(dto.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Amount tidak valid');
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(WalletTransaction);

      const wallet = await walletRepo.findOne({ where: { id: dto.walletId } });
      if (!wallet) throw new BadRequestException('Wallet tidak ditemukan');

      wallet.balance = (Number(wallet.balance) + amount).toFixed(2);

      const tx = txRepo.create({
        wallet,
        amount: amount.toFixed(2),
        type: 'CREDIT',
        category: 'ADJUSTMENT',
        adminNote: dto.adminNote,
      });

      await walletRepo.save(wallet);
      const savedTx = await txRepo.save(tx);
      await this.logAdminAction(adminId, 'TOPUP_WALLET', 'wallet', wallet.id, {
        amount: tx.amount,
        adminNote: tx.adminNote,
      });
      return savedTx;
    });
  }

  async listAdminActions(page = 1, limit = 20) {
    const repo = this.dataSource.getRepository(AdminActionLog);
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [data, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { data, page: Math.max(page, 1), limit: take, total };
  }

  private async logAdminAction(
    adminId: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    meta?: Record<string, unknown>,
  ) {
    try {
      const repo = this.dataSource?.getRepository?.(AdminActionLog);
      if (!repo || !repo.create || !repo.save) return;
      const log = repo.create({
        adminId: adminId ?? null,
        action,
        targetType,
        targetId,
        meta: meta ?? null,
      });
      await repo.save(log);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[AdminActionLog] failed to persist', err);
    }
  }
}
