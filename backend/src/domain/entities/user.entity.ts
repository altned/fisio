import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'PATIENT' | 'THERAPIST' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE';
export type BloodType = 'A' | 'B' | 'AB' | 'O';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  @Column({ type: 'varchar', length: 20, default: 'PATIENT' })
  role!: UserRole;

  @Column({ name: 'password_hash', type: 'varchar', length: 160, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'is_profile_complete', type: 'boolean', default: false })
  isProfileComplete!: boolean;

  @Column({ name: 'fcm_token', type: 'text', nullable: true })
  fcmToken!: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber!: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'profile_photo_url', type: 'text', nullable: true })
  profilePhotoUrl!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  // Extended patient profile fields
  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender!: Gender | null;

  @Column({ name: 'blood_type', type: 'varchar', length: 5, nullable: true })
  bloodType!: BloodType | null;

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory!: string | null;

  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 160, nullable: true })
  emergencyContactName!: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone!: string | null;

  @Column({ type: 'integer', nullable: true })
  height!: number | null; // in cm

  @Column({ type: 'integer', nullable: true })
  weight!: number | null; // in kg

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
