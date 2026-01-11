import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export type TherapistBidang =
  | 'Fisioterapi Muskuloskeletal'
  | 'Fisioterapi Neuromuskular'
  | 'Fisioterapi Kardiopulmoner'
  | 'Fisioterapi Pediatrik'
  | 'Fisioterapi Geriatrik'
  | 'Fisioterapi Olahraga';

export type TherapistGender = 'MALE' | 'FEMALE';

@Entity({ name: 'therapists' })
export class Therapist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bidang!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  @Column({ name: 'str_number', type: 'varchar', length: 50, nullable: true })
  strNumber!: string | null;

  @Column({ name: 'experience_years', type: 'integer', default: 0 })
  experienceYears!: number;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: string;

  @Column({ name: 'total_reviews', type: 'integer', default: 0 })
  totalReviews!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  // Extended therapist profile fields
  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender!: TherapistGender | null;

  @Column({ name: 'str_expiry_date', type: 'date', nullable: true })
  strExpiryDate!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  education!: string | null; // e.g., "S1 Fisioterapi UI"

  @Column({ type: 'text', nullable: true })
  certifications!: string | null; // JSON string or comma-separated

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
