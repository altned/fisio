import { BookingStatus } from '../../../domain/entities/booking.entity';

export interface SearchBookingDto {
  therapistId?: string;
  userId?: string;
  status?: BookingStatus;
  from?: Date | null;
  to?: Date | null;
  page?: number;
  limit?: number;
}
