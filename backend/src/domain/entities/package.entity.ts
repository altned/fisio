import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'packages' })
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'session_count', type: 'integer' })
  sessionCount!: number;

  @Column({ name: 'total_price', type: 'numeric', precision: 12, scale: 2 })
  totalPrice!: string;

  // Commission rate is percentage taken by platform (e.g., 30 means 30%)
  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 2, default: 30 })
  commissionRate!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}

