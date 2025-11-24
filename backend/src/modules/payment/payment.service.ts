import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Booking, PaymentMethod } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { NotificationService } from '../notification/notification.service';
import { BookingService } from '../booking/booking.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { UploadProofDto } from './dto/upload-proof.dto';

type PaymentInstruction = {
  method: 'BANK_TRANSFER' | 'QRIS';
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  qrisImageUrl?: string;
  bookingId: string;
  amount: string;
  status: string;
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingService: BookingService,
    private readonly notificationService: NotificationService,
  ) {}

  async initiatePayment(payload: InitiatePaymentDto): Promise<PaymentInstruction> {
    const bookingRepo = this.dataSource.getRepository(Booking);
    const booking = await bookingRepo.findOne({ where: { id: payload.bookingId } });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    if (booking.status !== 'PENDING') throw new BadRequestException('Booking bukan PENDING');

    booking.paymentMethod = payload.method as PaymentMethod;
    await bookingRepo.save(booking);

    if (payload.method === 'BANK_TRANSFER') {
      const bankName = process.env.COMPANY_BANK_NAME;
      const bankAccount = process.env.COMPANY_BANK_ACCOUNT;
      const bankAccountName = process.env.COMPANY_BANK_ACCOUNT_NAME;
      if (!bankName || !bankAccount || !bankAccountName) {
        throw new BadRequestException('Rekening perusahaan belum dikonfigurasi');
      }
      return {
        method: 'BANK_TRANSFER',
        bankName,
        bankAccount,
        bankAccountName,
        bookingId: booking.id,
        amount: booking.totalPrice,
        status: booking.status,
      };
    }

    if (payload.method === 'QRIS') {
      const qrisImageUrl = process.env.QRIS_IMAGE_URL;
      if (!qrisImageUrl) throw new BadRequestException('QRIS belum dikonfigurasi');
      return {
        method: 'QRIS',
        qrisImageUrl,
        bookingId: booking.id,
        amount: booking.totalPrice,
        status: booking.status,
      };
    }

    throw new BadRequestException('Metode pembayaran tidak dikenal');
  }

  async confirmPayment(payload: ConfirmPaymentDto): Promise<Booking> {
    const bookingRepo = this.dataSource.getRepository(Booking);
    const sessionRepo = this.dataSource.getRepository(Session);
    const booking = await bookingRepo.findOne({
      where: { id: payload.bookingId },
      relations: ['therapist', 'therapist.user'],
    });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    if (booking.status === 'PAID') return booking;
    if (booking.status !== 'PENDING') throw new BadRequestException('Status booking tidak valid');

    booking.status = 'PAID';
    booking.therapistRespondBy = this.bookingService.computeRespondBy(booking.bookingType);
    if (!booking.chatLockedAt) {
      const firstSession = await sessionRepo.findOne({
        where: { booking: { id: booking.id }, sequenceOrder: 1 },
      });
      if (firstSession?.scheduledAt) {
        booking.chatLockedAt = this.bookingService.computeChatLockAt(firstSession.scheduledAt);
      }
    }
    // Catat reference jika perlu di kemudian hari
    const saved = await bookingRepo.save(booking);
    await this.notificationService.notifyBookingAccepted({
      therapistId: booking.therapist.id,
      deviceToken: booking.therapist.user?.fcmToken ?? undefined,
      title: 'Pembayaran terkonfirmasi',
      body: 'Booking siap direspons',
      meta: { bookingId: booking.id },
    });
    return saved;
  }

  async uploadProof(payload: UploadProofDto): Promise<Booking> {
    const bookingRepo = this.dataSource.getRepository(Booking);
    const booking = await bookingRepo.findOne({ where: { id: payload.bookingId } });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    booking.paymentProofUrl = payload.proofUrl;
    return bookingRepo.save(booking);
  }
}
