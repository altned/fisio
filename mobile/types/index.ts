/**
 * Fisioku API Types
 */

// User & Auth
export type UserRole = 'PATIENT' | 'THERAPIST' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isProfileComplete: boolean;
    fcmToken?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    profilePhotoUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    // Extended patient profile fields
    birthDate?: string | null;
    gender?: Gender | null;
    bloodType?: string | null;
    allergies?: string | null;
    medicalHistory?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    height?: number | null;
    weight?: number | null;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    user: Partial<User>;
}

// Therapist
export type TherapistBidang =
    | 'Fisioterapi Muskuloskeletal'
    | 'Fisioterapi Neuromuskular'
    | 'Fisioterapi Kardiopulmoner'
    | 'Fisioterapi Pediatrik'
    | 'Fisioterapi Geriatrik'
    | 'Fisioterapi Olahraga';

export interface Therapist {
    id: string;
    bidang?: TherapistBidang | string | null;
    address?: string | null;
    city?: string | null;
    experienceYears?: number;
    averageRating: string;
    totalReviews: number;
    photoUrl?: string | null;
    bio?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    distance?: number; // Calculated distance in km (from nearby endpoint)
    // Extended therapist profile fields
    birthDate?: string | null;
    gender?: Gender | null;
    strNumber?: string | null;
    strExpiryDate?: string | null;
    education?: string | null;
    certifications?: string | null;
    user?: {
        id: string;
        fullName: string;
    };
}

// Package
export interface Package {
    id: string;
    name: string;
    sessionCount: number;
    totalPrice: string;
}

// Booking
export type BookingStatus = 'PENDING' | 'PAID' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
export type RefundStatus = 'NONE' | 'PENDING' | 'COMPLETED';
export type BookingType = 'REGULAR' | 'INSTANT';

export interface Booking {
    id: string;
    user: User;
    therapist: Therapist;
    package?: Package | null;
    lockedAddress: string;
    latitude?: number | null;
    longitude?: number | null;
    totalPrice: string;
    adminFeeAmount: string;
    therapistNetTotal: string;
    bookingType: BookingType;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    paymentInstruction?: Record<string, unknown> | null;
    paymentExpiryTime?: string | null;
    refundStatus: RefundStatus;
    therapistRespondBy?: string | null;
    therapistAcceptedAt?: string | null;
    chatLockedAt?: string | null;
    isChatActive?: boolean;
    hasReviewed?: boolean;
    createdAt: string;
    sessions?: Session[];
    // Consent fields
    consentService?: boolean;
    consentDataSharing?: boolean;
    consentTerms?: boolean;
    consentMedicalDisclaimer?: boolean;
    consentVersion?: string | null;
    consentedAt?: string | null;
}


// Session
export type SessionStatus =
    | 'PENDING_SCHEDULING'
    | 'SCHEDULED'
    | 'COMPLETED'
    | 'FORFEITED'
    | 'EXPIRED'
    | 'CANCELLED';

export interface Session {
    id: string;
    bookingId: string;
    therapistId: string;
    sequenceOrder: number;
    scheduledAt?: string | null;
    status: SessionStatus;
    isPayoutDistributed: boolean;
    // Cancellation tracking
    cancellationReason?: string | null;
    cancelledAt?: string | null;
    cancelledBy?: 'PATIENT' | 'THERAPIST' | 'SYSTEM' | null;
}

// Wallet
export interface Wallet {
    id: string;
    therapistId: string;
    balance: string;
}

export interface WalletStats {
    monthIncome: string;
}

export interface WalletTransaction {
    id: string;
    walletId: string;
    amount: string;
    type: 'CREDIT' | 'DEBIT';
    category: 'SESSION_FEE' | 'FORFEIT_COMPENSATION' | 'WITHDRAWAL' | 'TOPUP' | 'ADJUSTMENT';
    adminNote?: string | null;
    createdAt: string;
}

// Review
export interface Review {
    id: string;
    bookingId: string;
    therapistId: string;
    rating: number;
    createdAt: string;
}

// Payment
export type PaymentChannel =
    | 'VA_BCA'
    | 'VA_BNI'
    | 'VA_BRI'
    | 'VA_MANDIRI'
    | 'VA_PERMATA'
    | 'QRIS'
    | 'GOPAY'
    | 'SHOPEEPAY';

export interface PaymentInitiateResult {
    bookingId: string;
    orderId: string;
    channel: PaymentChannel;
    status: PaymentStatus;
    amount: string;
    instruction?: Record<string, unknown> | null;
    redirectUrl?: string | null;
    token?: string | null;
    expiryTime?: string | null;
}

// API Response
export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
}

// Create Booking Payload
export interface CreateBookingPayload {
    therapistId: string;
    packageId: string;
    address: string;
    scheduledAt: string; // ISO date string
    bookingType: BookingType;
    // Consent fields - all required
    consentService: boolean;
    consentDataSharing: boolean;
    consentTerms: boolean;
    consentMedicalDisclaimer: boolean;
}

