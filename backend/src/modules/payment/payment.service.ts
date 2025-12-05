import { Injectable, BadRequestException, GoneException, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking, PaymentStatus } from '../../domain/entities/booking.entity';
import { Session } from '../../domain/entities/session.entity';
import { MidtransWebhookLog } from '../../domain/entities/midtrans-webhook-log.entity';
import { NotificationService } from '../notification/notification.service';
import { BookingService } from '../booking/booking.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto, PaymentChannel } from './dto/initiate-payment.dto';
import { UploadProofDto } from './dto/upload-proof.dto';
import * as crypto from 'crypto';

type MidtransChargeResult = {
  bookingId: string;
  orderId: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  amount: string;
  instruction?: Record<string, unknown> | null;
  redirectUrl?: string | null;
  token?: string | null;
  expiryTime?: Date | null;
  rawResponse: Record<string, unknown>;
};

type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status:
    | 'capture'
    | 'settlement'
    | 'pending'
    | 'deny'
    | 'cancel'
    | 'expire'
    | 'refund'
    | 'partial_refund'
    | 'authorize';
  fraud_status?: 'accept' | 'challenge' | 'deny';
  signature_key: string;
  payment_type?: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  actions?: Array<{ name?: string; method?: string; url?: string }>;
  [key: string]: unknown;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingService: BookingService,
    private readonly notificationService: NotificationService,
  ) {}

  async initiatePayment(payload: InitiatePaymentDto): Promise<MidtransChargeResult> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new BadRequestException('MIDTRANS_SERVER_KEY belum dikonfigurasi');

    const bookingRepo = this.dataSource.getRepository(Booking);
    const booking = await bookingRepo.findOne({
      where: { id: payload.bookingId },
      relations: ['user'],
    });
    if (!booking) throw new BadRequestException('Booking tidak ditemukan');
    if (booking.status !== 'PENDING') throw new BadRequestException('Booking bukan PENDING');

    const orderId = this.buildOrderId(booking.id);
    const grossAmount = Number(booking.totalPrice);
    if (Number.isNaN(grossAmount) || grossAmount <= 0) {
      throw new BadRequestException('Nominal booking tidak valid');
    }

    const chargePayload = this.buildChargePayload(payload.channel, orderId, grossAmount, {
      email: booking.user?.email ?? undefined,
    });

    const rawResponse = await this.callMidtrans('/v2/charge', chargePayload, serverKey);
    const statusCode = (rawResponse.status_code as string) ?? '';
    if (!['200', '201'].includes(statusCode)) {
      throw new BadRequestException(`Midtrans charge gagal (${statusCode})`);
    }

    const instruction = this.extractInstruction(payload.channel, rawResponse);
    const expiryTime = rawResponse.expiry_time ? new Date(rawResponse.expiry_time as string) : null;
    const redirectUrl =
      (rawResponse.redirect_url as string | undefined) ??
      this.extractActionUrl(rawResponse, 'deeplink-redirect');

    booking.paymentProvider = 'MIDTRANS';
    booking.paymentStatus = 'PENDING';
    booking.paymentOrderId = orderId;
    booking.paymentToken = (rawResponse.token_id as string | undefined) ?? null;
    booking.paymentRedirectUrl = redirectUrl ?? null;
    booking.paymentInstruction = instruction ?? null;
    booking.paymentExpiryTime = expiryTime;
    booking.paymentPayload = rawResponse as Record<string, unknown>;

    await bookingRepo.save(booking);

    return {
      bookingId: booking.id,
      orderId,
      channel: payload.channel,
      status: 'PENDING',
      amount: booking.totalPrice,
      instruction,
      redirectUrl: redirectUrl ?? null,
      token: booking.paymentToken,
      expiryTime,
      rawResponse: rawResponse as Record<string, unknown>,
    };
  }

  async confirmPayment(_: ConfirmPaymentDto): Promise<Booking> {
    throw new GoneException('Konfirmasi manual dinonaktifkan; status pembayaran via webhook Midtrans');
  }

  async uploadProof(_: UploadProofDto): Promise<Booking> {
    throw new GoneException('Upload bukti bayar tidak tersedia; gunakan Midtrans');
  }

  async handleMidtransNotification(body: MidtransNotification) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new BadRequestException('MIDTRANS_SERVER_KEY belum dikonfigurasi');

    if (!body.order_id || !body.status_code || !body.gross_amount) {
      throw new BadRequestException('Payload webhook Midtrans tidak lengkap');
    }

    this.verifySignature(body, serverKey);

    const bookingRepo = this.dataSource.getRepository(Booking);
    const sessionRepo = this.dataSource.getRepository(Session);
    const logRepo = this.dataSource.getRepository(MidtransWebhookLog);
    const orderId = body.order_id;

    let booking =
      (await bookingRepo.findOne({
        where: { paymentOrderId: orderId },
        relations: ['therapist', 'therapist.user', 'user'],
      })) ?? null;

    if (!booking && orderId) {
      const [maybeBookingId] = orderId.split('-');
      if (maybeBookingId && this.isUuid(maybeBookingId)) {
        booking = await bookingRepo.findOne({
          where: { id: maybeBookingId },
          relations: ['therapist', 'therapist.user', 'user'],
        });
      }
    }

    if (!booking) {
      await this.saveWebhookLog(logRepo, {
        orderId,
        bookingId: null,
        paymentStatus: 'FAILED',
        transactionStatus: body.transaction_status,
        rawPayload: body as Record<string, unknown>,
      });
      this.logger.warn(`Webhook Midtrans: booking not found for order_id=${orderId}`);
      throw new BadRequestException('Booking untuk order_id ini tidak ditemukan');
    }

    const nextPaymentStatus = this.mapTransactionStatus(body.transaction_status);
    if (!nextPaymentStatus) {
      throw new BadRequestException(`Status transaksi tidak dikenal: ${body.transaction_status}`);
    }

    if (booking.paymentStatus === nextPaymentStatus && booking.paymentPayload) {
      return { ok: true, message: 'no-op' };
    }

    if (nextPaymentStatus === 'PENDING') {
      booking.paymentStatus = 'PENDING';
      booking.paymentPayload = body as Record<string, unknown>;
      const instruction = this.extractInstructionFromNotification(body);
      booking.paymentInstruction = booking.paymentInstruction ?? instruction ?? null;
      booking.paymentExpiryTime = booking.paymentExpiryTime ?? this.parseExpiry(body);
      await bookingRepo.save(booking);
      this.logger.log(
        `Webhook Midtrans PENDING order_id=${orderId} booking_id=${booking.id} status=${body.transaction_status}`,
      );
      await this.saveWebhookLog(logRepo, {
        orderId,
        bookingId: booking.id,
        paymentStatus: 'PENDING',
        transactionStatus: body.transaction_status,
        rawPayload: body as Record<string, unknown>,
      });
      return { ok: true, status: 'PENDING' };
    }

    if (nextPaymentStatus === 'PAID') {
      const wasPaid = booking.status === 'PAID';
      booking.status = 'PAID';
      booking.paymentStatus = 'PAID';
      booking.paymentPayload = body as Record<string, unknown>;
      const instruction = this.extractInstructionFromNotification(body);
      booking.paymentInstruction = booking.paymentInstruction ?? instruction ?? null;
      booking.paymentExpiryTime = this.parseExpiry(body);
      booking.therapistRespondBy = this.bookingService.computeRespondBy(booking.bookingType);

      if (!booking.chatLockedAt) {
        const firstSession = await sessionRepo.findOne({
          where: { booking: { id: booking.id }, sequenceOrder: 1 },
        });
        if (firstSession?.scheduledAt) {
          booking.chatLockedAt = this.bookingService.computeChatLockAt(firstSession.scheduledAt);
        }
      }

      const saved = await bookingRepo.save(booking);
      if (!wasPaid) {
        await this.notificationService.notifyBookingAccepted({
          therapistId: booking.therapist.id,
          deviceToken: booking.therapist.user?.fcmToken ?? undefined,
          title: 'Pembayaran terkonfirmasi',
          body: 'Booking siap direspons',
          meta: { bookingId: booking.id },
        });
        await this.notificationService.notifyBookingAccepted({
          userId: booking.user.id,
          deviceToken: booking.user?.fcmToken ?? undefined,
          title: 'Pembayaran terkonfirmasi',
          body: 'Pembayaran berhasil, menunggu respon terapis',
          meta: { bookingId: booking.id },
        });
      }
      this.logger.log(
        `Webhook Midtrans PAID order_id=${orderId} booking_id=${booking.id} status=${body.transaction_status}`,
      );
      await this.saveWebhookLog(logRepo, {
        orderId,
        bookingId: booking.id,
        paymentStatus: 'PAID',
        transactionStatus: body.transaction_status,
        rawPayload: body as Record<string, unknown>,
      });
      return { ok: true, status: 'PAID' };
    }

    // expire/cancel/failed
    if (booking.status !== 'PAID') {
      booking.status = 'CANCELLED';
      booking.refundStatus = 'PENDING';
    }
    booking.paymentStatus = nextPaymentStatus;
    booking.paymentPayload = body as Record<string, unknown>;
    await bookingRepo.save(booking);
    this.logger.warn(
      `Webhook Midtrans terminal order_id=${orderId} booking_id=${booking.id} paymentStatus=${nextPaymentStatus} tx=${body.transaction_status}`,
    );
    await this.saveWebhookLog(logRepo, {
      orderId,
      bookingId: booking.id,
      paymentStatus: nextPaymentStatus,
      transactionStatus: body.transaction_status,
      rawPayload: body as Record<string, unknown>,
    });
    return { ok: true, status: nextPaymentStatus };
  }

  private buildOrderId(bookingId: string): string {
    const suffix = Date.now();
    return `${bookingId}-${suffix}`;
  }

  private buildChargePayload(
    channel: PaymentChannel,
    orderId: string,
    grossAmount: number,
    opts?: { email?: string },
  ): Record<string, unknown> {
    const transaction_details = { order_id: orderId, gross_amount: grossAmount };
    const customer_details = opts?.email ? { email: opts.email } : undefined;
    const base: Record<string, unknown> = { transaction_details };
    if (customer_details) base.customer_details = customer_details;

    if (channel === 'QRIS') {
      return { ...base, payment_type: 'qris' };
    }

    if (channel === 'GOPAY') {
      return {
        ...base,
        payment_type: 'gopay',
        gopay: {
          enable_callback: true,
          callback_url: process.env.MIDTRANS_CALLBACK_URL ?? undefined,
        },
      };
    }

    const bank = this.mapVaBank(channel);
    return {
      ...base,
      payment_type: 'bank_transfer',
      bank_transfer: { bank },
    };
  }

  private mapVaBank(channel: PaymentChannel): string {
    if (channel === 'BCA_VA') return 'bca';
    if (channel === 'BNI_VA') return 'bni';
    if (channel === 'BRI_VA') return 'bri';
    if (channel === 'PERMATA_VA') return 'permata';
    return 'bca';
  }

  private async callMidtrans(path: string, body: Record<string, unknown>, serverKey: string) {
    const baseUrl =
      process.env.MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com';
    const fetchMod = await import('node-fetch');
    const res = await fetchMod.default(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const statusCode = (json.status_code as string) ?? res.status.toString();
      const statusMessage = (json.status_message as string) ?? res.statusText;
      throw new BadRequestException(`Midtrans error ${statusCode}: ${statusMessage}`);
    }
    return json;
  }

  private extractInstruction(channel: PaymentChannel, payload: Record<string, unknown>) {
    if (channel === 'QRIS' || channel === 'GOPAY') {
      const actions = (payload.actions as Array<{ name?: string; url?: string }> | undefined) ?? [];
      return {
        type: channel,
        actions,
      };
    }

    if (channel === 'PERMATA_VA') {
      return {
        type: 'VA',
        bank: 'permata',
        account: payload.permata_va_number ?? null,
      };
    }

    const vaNumbers = (payload.va_numbers as Array<{ bank: string; va_number: string }> | undefined) ?? [];
    const va = vaNumbers[0];
    return {
      type: 'VA',
      bank: va?.bank ?? this.mapVaBank(channel),
      account: va?.va_number ?? null,
    };
  }

  private extractInstructionFromNotification(body: MidtransNotification) {
    if (body.payment_type === 'qris' || body.payment_type === 'gopay') {
      return { type: body.payment_type, actions: body.actions ?? [] };
    }
    if (body.payment_type === 'permata') {
      return { type: 'VA', bank: 'permata', account: body.permata_va_number ?? null };
    }
    if (body.va_numbers?.length) {
      const va = body.va_numbers[0];
      return { type: 'VA', bank: va.bank, account: va.va_number };
    }
    return undefined;
  }

  private extractActionUrl(payload: Record<string, unknown>, name: string): string | null {
    const actions = (payload.actions as Array<{ name?: string; url?: string }> | undefined) ?? [];
    const action = actions.find((a) => a.name === name);
    return action?.url ?? null;
  }

  private verifySignature(body: MidtransNotification, serverKey: string) {
    const expected = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
      .digest('hex');
    if (body.signature_key !== expected) {
      throw new BadRequestException('Signature Midtrans tidak valid');
    }
  }

  private mapTransactionStatus(txStatus: MidtransNotification['transaction_status']): PaymentStatus | null {
    if (txStatus === 'settlement' || txStatus === 'capture') return 'PAID';
    if (txStatus === 'pending' || txStatus === 'authorize') return 'PENDING';
    if (txStatus === 'expire') return 'EXPIRED';
    if (txStatus === 'cancel' || txStatus === 'deny' || txStatus === 'refund' || txStatus === 'partial_refund') {
      return 'CANCELLED';
    }
    return 'FAILED';
  }

  private parseExpiry(body: MidtransNotification): Date | null {
    const timeString = (body as Record<string, unknown>).expiry_time as string | undefined;
    if (!timeString) return null;
    const parsed = new Date(timeString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      value,
    );
  }

  private async saveWebhookLog(
    repo: Repository<MidtransWebhookLog>,
    log: Pick<
      MidtransWebhookLog,
      'orderId' | 'bookingId' | 'paymentStatus' | 'transactionStatus' | 'rawPayload'
    >,
  ) {
    try {
      const entity = repo.create(log);
      await repo.save(entity);
    } catch (err) {
      this.logger.warn(`Failed to save Midtrans webhook log for order_id=${log.orderId}`, err as Error);
    }
  }
}
