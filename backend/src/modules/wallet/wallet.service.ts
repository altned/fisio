import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { WalletTransaction, WalletTransactionCategory } from '../../domain/entities/wallet-transaction.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { NotificationService } from '../notification/notification.service';
import { WalletStats } from './dto/wallet-stats.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async payoutSession(sessionId: string, options?: { adminNote?: string }): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(Session);
      const bookingRepo = manager.getRepository(Booking);
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(WalletTransaction);

      const session = await sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['booking', 'therapist'],
      });
      if (!session) throw new BadRequestException('Session tidak ditemukan');
      if (session.status !== 'COMPLETED' && session.status !== 'FORFEITED') {
        throw new BadRequestException('Session belum layak payout');
      }
      if (session.isPayoutDistributed) return; // idempotent

      const booking = await bookingRepo.findOne({
        where: { id: session.booking.id },
        relations: ['therapist', 'therapist.user'],
      });
      if (!booking) throw new BadRequestException('Booking tidak ditemukan');

      const totalSessions = await sessionRepo.count({ where: { booking: { id: booking.id } } });
      if (totalSessions === 0) throw new BadRequestException('Total sesi tidak valid');

      const unit = Number(booking.therapistNetTotal) / totalSessions;
      const amount = unit.toFixed(2);

      const category: WalletTransactionCategory =
        session.status === 'FORFEITED' ? 'FORFEIT_COMPENSATION' : 'SESSION_FEE';

      let wallet = await walletRepo.findOne({
        where: { therapist: { id: booking.therapist.id } },
        relations: ['therapist'],
      });
      if (!wallet) {
        wallet = walletRepo.create({ therapist: booking.therapist, balance: '0' });
        wallet = await walletRepo.save(wallet);
      }

      wallet.balance = (Number(wallet.balance) + Number(amount)).toFixed(2);
      session.isPayoutDistributed = true;

      const tx = txRepo.create({
        wallet,
        amount,
        type: 'CREDIT',
        category,
        adminNote: options?.adminNote ?? null,
      });

      await walletRepo.save(wallet);
      await sessionRepo.save(session);
      await txRepo.save(tx);

      await this.notificationService.notifyPayoutSuccess({
        therapistId: booking.therapist.id,
        deviceToken: booking.therapist.user?.fcmToken ?? undefined,
        title: 'Payout masuk',
        body: `Payout sesi ${session.sequenceOrder} telah masuk`,
        meta: { bookingId: booking.id, sessionId: session.id, amount },
      });
    });
  }

  async getMonthlyIncome(walletId: string): Promise<WalletStats> {
    const txRepo = this.dataSource.getRepository(WalletTransaction);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'sum')
      .where('tx.wallet_id = :walletId', { walletId })
      .andWhere('tx.type = :type', { type: 'CREDIT' })
      .andWhere('EXTRACT(MONTH FROM tx.created_at) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM tx.created_at) = :year', { year })
      .getRawOne<{ sum: string }>();

    return { monthIncome: result?.sum ?? '0' };
  }
}
