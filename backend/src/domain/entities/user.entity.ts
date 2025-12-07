import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'PATIENT' | 'THERAPIST' | 'ADMIN';

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
