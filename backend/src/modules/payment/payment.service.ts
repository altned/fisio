import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { Booking } from '../../domain/entities/booking.entity';
import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly dataSource: DataSource) {}

  async handleWebhook(payload: MidtransWebhookDto) {
    if (!this.isSignatureValid(payload)) {
      throw new BadRequestException('Signature tidak valid');
    }

    const booking = await this.dataSource.getRepository(Booking).findOne({
      where: { id: payload.order_id },
    });
    if (!booking) {
      throw new BadRequestException('Booking tidak ditemukan');
    }

    if (booking.status === 'PAID') {
      return booking;
    }

    const payableStatuses = ['settlement', 'capture'];
    if (!payableStatuses.includes(payload.transaction_status)) {
      throw new BadRequestException('Status transaksi belum settle');
    }

    booking.status = 'PAID';
    return this.dataSource.getRepository(Booking).save(booking);
  }

  private isSignatureValid(payload: MidtransWebhookDto): boolean {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return false;
    const toSign = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
    const signature = crypto.createHash('sha512').update(toSign).digest('hex');
    return signature === payload.signature_key;
  }
}
