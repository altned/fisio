import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'midtrans_webhook_logs' })
export class MidtransWebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'varchar', length: 64 })
  orderId!: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId!: string | null;

  @Column({ name: 'payment_status', type: 'varchar', length: 20 })
  paymentStatus!: string;

  @Column({ name: 'transaction_status', type: 'varchar', length: 30 })
  transactionStatus!: string;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
