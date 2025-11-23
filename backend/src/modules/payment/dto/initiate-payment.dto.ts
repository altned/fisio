export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS';

export interface InitiatePaymentDto {
  bookingId: string;
  method: PaymentMethod;
}
