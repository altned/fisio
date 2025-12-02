export type BookingStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export type SessionStatus = 'PENDING_SCHEDULING' | 'SCHEDULED' | 'COMPLETED' | 'FORFEITED' | 'EXPIRED';

export type Session = {
  id: string;
  sequenceOrder: number;
  scheduledAt: string | null;
  status: SessionStatus;
  isPayoutDistributed: boolean;
};

export type Booking = {
  id: string;
  user: { id: string };
  therapist: { id: string };
  status: BookingStatus;
  bookingType: 'REGULAR' | 'INSTANT';
  therapistRespondBy?: string | null;
  lockedAddress: string;
  chatLockedAt?: string | null;
  refundStatus?: string;
  createdAt?: string;
  sessions?: Session[];
};

export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};
