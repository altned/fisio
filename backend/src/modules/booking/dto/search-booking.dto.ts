import { BookingStatus, PaymentStatus } from '../../../domain/entities/booking.entity';

export interface SearchBookingDto {
  therapistId?: string;
  userId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  from?: Date | null;
  to?: Date | null;
  page?: number;
  limit?: number;
}
