export type PaymentChannel = 'BCA_VA' | 'BNI_VA' | 'BRI_VA' | 'PERMATA_VA' | 'QRIS' | 'GOPAY';

export interface InitiatePaymentDto {
  bookingId: string;
  channel: PaymentChannel;
}
