import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Package } from './package.entity';
import { Session } from './session.entity';
import { Therapist } from './therapist.entity';
import { User } from './user.entity';

export type BookingStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS';
export type BookingType = 'REGULAR' | 'INSTANT';
export type RefundStatus = 'NONE' | 'PENDING' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Therapist, { nullable: false })
  @JoinColumn({ name: 'therapist_id' })
  therapist!: Therapist;

  @ManyToOne(() => Package, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package?: Package | null;

  @Column({ name: 'locked_address', type: 'text' })
  lockedAddress!: string;

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  @Column({ name: 'total_price', type: 'numeric', precision: 12, scale: 2 })
  totalPrice!: string;

  @Column({ name: 'admin_fee_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  adminFeeAmount!: string;

  @Column({ name: 'therapist_net_total', type: 'numeric', precision: 12, scale: 2 })
  therapistNetTotal!: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: true })
  paymentMethod?: PaymentMethod | null;

  @Column({ name: 'payment_proof_url', type: 'text', nullable: true })
  paymentProofUrl?: string | null;

  @Column({ name: 'payment_provider', type: 'varchar', length: 30, default: 'MIDTRANS' })
  paymentProvider!: string;

  @Column({ name: 'payment_status', type: 'varchar', length: 20, default: 'PENDING' })
  paymentStatus!: PaymentStatus;

  @Column({ name: 'payment_order_id', type: 'varchar', length: 64, nullable: true })
  paymentOrderId!: string | null;

  @Column({ name: 'payment_token', type: 'varchar', length: 160, nullable: true })
  paymentToken!: string | null;

  @Column({ name: 'payment_redirect_url', type: 'text', nullable: true })
  paymentRedirectUrl!: string | null;

  @Column({ name: 'payment_instruction', type: 'jsonb', nullable: true })
  paymentInstruction!: Record<string, unknown> | null;

  @Column({ name: 'payment_expiry_time', type: 'timestamp with time zone', nullable: true })
  paymentExpiryTime!: Date | null;

  @Column({ name: 'payment_payload', type: 'jsonb', nullable: true })
  paymentPayload!: Record<string, unknown> | null;

  @Column({ name: 'booking_type', type: 'varchar', length: 20, default: 'REGULAR' })
  bookingType!: BookingType;

  @Column({ name: 'therapist_respond_by', type: 'timestamp with time zone', nullable: true })
  therapistRespondBy!: Date | null;

  @Column({ name: 'therapist_accepted_at', type: 'timestamp with time zone', nullable: true })
  therapistAcceptedAt!: Date | null;

  @Column({ name: 'is_chat_active', type: 'boolean', default: true })
  isChatActive!: boolean;

  @Column({ name: 'refund_status', type: 'varchar', length: 20, default: 'NONE' })
  refundStatus!: RefundStatus;

  @Column({ name: 'refund_reference', type: 'varchar', length: 160, nullable: true })
  refundReference!: string | null;

  @Column({ name: 'refund_note', type: 'text', nullable: true })
  refundNote!: string | null;

  @Column({ name: 'refunded_at', type: 'timestamp with time zone', nullable: true })
  refundedAt!: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: BookingStatus;

  @Column({ name: 'chat_locked_at', type: 'timestamp with time zone', nullable: true })
  chatLockedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  // Consent fields - per booking
  @Column({ name: 'consent_service', type: 'boolean', default: false })
  consentService!: boolean;

  @Column({ name: 'consent_data_sharing', type: 'boolean', default: false })
  consentDataSharing!: boolean;

  @Column({ name: 'consent_terms', type: 'boolean', default: false })
  consentTerms!: boolean;

  @Column({ name: 'consent_medical_disclaimer', type: 'boolean', default: false })
  consentMedicalDisclaimer!: boolean;

  @Column({ name: 'consent_version', type: 'varchar', length: 20, nullable: true })
  consentVersion!: string | null;

  @Column({ name: 'consented_at', type: 'timestamp with time zone', nullable: true })
  consentedAt!: Date | null;

  @OneToMany(() => Session, (session) => session.booking)
  sessions!: Session[];
}

