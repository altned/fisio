export interface CompleteRefundDto {
  bookingId: string;
  adminId: string;
  refundReference?: string;
  refundNote?: string;
}
