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

export type BookingStatus = 'PENDING' | 'PAID' | 'COMPLETED';
export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS';

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

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: BookingStatus;

  @Column({ name: 'chat_locked_at', type: 'timestamp with time zone', nullable: true })
  chatLockedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @OneToMany(() => Session, (session) => session.booking)
  sessions!: Session[];
}
