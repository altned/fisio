import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export type WalletTransactionType = 'CREDIT' | 'DEBIT';
export type WalletTransactionCategory = 'SESSION_FEE' | 'FORFEIT_COMPENSATION' | 'WITHDRAWAL' | 'ADJUSTMENT';

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Wallet, { nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: WalletTransactionType;

  @Column({ type: 'varchar', length: 32, nullable: true })
  category!: WalletTransactionCategory | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
