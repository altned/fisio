import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Therapist } from './therapist.entity';

export type SessionStatus =
  | 'PENDING_SCHEDULING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'FORFEITED'
  | 'EXPIRED';

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @ManyToOne(() => Therapist, { nullable: false })
  @JoinColumn({ name: 'therapist_id' })
  therapist!: Therapist;

  @Column({ name: 'sequence_order', type: 'integer', default: 1 })
  sequenceOrder!: number;

  @Column({ name: 'scheduled_at', type: 'timestamp with time zone', nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: 'varchar', length: 24, default: 'PENDING_SCHEDULING' })
  status!: SessionStatus;

  @Column({ name: 'is_payout_distributed', type: 'boolean', default: false })
  isPayoutDistributed!: boolean;

  @Column({ name: 'therapist_notes', type: 'text', nullable: true })
  therapistNotes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
