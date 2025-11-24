import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { Therapist } from '../../domain/entities/therapist.entity';
import { WalletTransaction } from '../../domain/entities/wallet-transaction.entity';
import { Wallet } from '../../domain/entities/wallet.entity';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { SwapTherapistDto } from './dto/swap-therapist.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class AdminService {
  constructor(private readonly dataSource: DataSource) {}

  async completeRefund(input: CompleteRefundDto): Promise<Booking> {
    const repo = this.dataSource.getRepository(Booking);
    const booking = await repo.findOne({ where: { id: input.bookingId } });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    if (booking.status !== 'CANCELLED') throw new BadRequestException('Booking belum dibatalkan');
    if (booking.refundStatus === 'COMPLETED') return booking;

    booking.refundStatus = 'COMPLETED';
    booking.refundReference = input.refundReference ?? null;
    booking.refundNote = input.refundNote ?? null;
    booking.refundedAt = new Date();
    return repo.save(booking);
  }

  async swapTherapist(input: SwapTherapistDto): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const sessionRepo = manager.getRepository(Session);
      const therapistRepo = manager.getRepository(Therapist);

      const booking = await bookingRepo.findOne({
        where: { id: input.bookingId },
        relations: ['therapist'],
      });
      if (!booking) throw new BadRequestException('Booking tidak ditemukan');

      const newTherapist = await therapistRepo.findOne({ where: { id: input.newTherapistId } });
      if (!newTherapist) throw new BadRequestException('Terapis baru tidak ditemukan');

      booking.therapist = newTherapist;

      await sessionRepo
        .createQueryBuilder()
        .update(Session)
        .set({ therapist: newTherapist })
        .where('booking_id = :bookingId', { bookingId: booking.id })
        .andWhere('status IN (:...statuses)', { statuses: ['PENDING_SCHEDULING', 'SCHEDULED'] })
        .execute();

      return bookingRepo.save(booking);
    });
  }

  async withdraw(dto: WithdrawDto): Promise<WalletTransaction> {
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
      return txRepo.save(tx);
    });
  }
}
