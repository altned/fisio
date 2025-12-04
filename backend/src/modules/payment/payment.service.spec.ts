import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentService } from './payment.service';

const service = new PaymentService({} as any, {} as any, {} as any);

describe('PaymentService Midtrans helpers', () => {
  const mapStatus = (status: string) =>
    (service as any).mapTransactionStatus(status as any);

  it('maps Midtrans transaction_status to paymentStatus correctly', () => {
    expect(mapStatus('settlement')).toBe('PAID');
    expect(mapStatus('capture')).toBe('PAID');
    expect(mapStatus('pending')).toBe('PENDING');
    expect(mapStatus('authorize')).toBe('PENDING');
    expect(mapStatus('expire')).toBe('EXPIRED');
    expect(mapStatus('cancel')).toBe('CANCELLED');
    expect(mapStatus('deny')).toBe('CANCELLED');
    expect(mapStatus('refund')).toBe('CANCELLED');
    expect(mapStatus('partial_refund')).toBe('CANCELLED');
    expect(mapStatus('unknown-status')).toBe('FAILED');
  });

  it('verifies Midtrans signature correctly', () => {
    const serverKey = 'secret-key';
    const body = {
      order_id: 'ORDER-123',
      status_code: '200',
      gross_amount: '10000.00',
    };
    const signature = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
      .digest('hex');

    expect(() =>
      (service as any).verifySignature({ ...body, signature_key: signature }, serverKey),
    ).not.toThrow();

    expect(() =>
      (service as any).verifySignature({ ...body, signature_key: 'invalid' }, serverKey),
    ).toThrow(BadRequestException);
  });
});
