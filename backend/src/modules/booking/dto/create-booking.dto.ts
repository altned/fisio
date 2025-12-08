export type BookingType = 'REGULAR' | 'INSTANT';

export interface CreateBookingDto {
  userId: string;
  therapistId: string;
  packageId?: string;
  lockedAddress: string;
  scheduledAt: Date;
  bookingType: BookingType;
  totalPrice: string;
  adminFeeAmount: string;
  therapistNetTotal: string;
  // Consent fields - all required and must be true
  consentService: boolean;
  consentDataSharing: boolean;
  consentTerms: boolean;
  consentMedicalDisclaimer: boolean;
}
