/**
 * Fisioku API Types
 */

// User & Auth
export type UserRole = 'PATIENT' | 'THERAPIST' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isProfileComplete: boolean;
    fcmToken?: string | null;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    user: Partial<User>;
}

// Therapist
export interface Therapist {
    id: string;
    averageRating: string;
    totalReviews: number;
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
export type BookingStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
export type RefundStatus = 'NONE' | 'PENDING' | 'COMPLETED';
export type BookingType = 'REGULAR' | 'INSTANT';

export interface Booking {
    id: string;
    user: User;
    therapist: Therapist;
    package?: Package | null;
    lockedAddress: string;
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
    createdAt: string;
    sessions?: Session[];
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
