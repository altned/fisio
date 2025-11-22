import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Booking } from '../domain/entities/booking.entity';
import { Package } from '../domain/entities/package.entity';
import { Review } from '../domain/entities/review.entity';
import { Session } from '../domain/entities/session.entity';
import { Therapist } from '../domain/entities/therapist.entity';
import { User } from '../domain/entities/user.entity';
import { Wallet } from '../domain/entities/wallet.entity';
import { WalletTransaction } from '../domain/entities/wallet-transaction.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Therapist, Package, Booking, Session, Wallet, WalletTransaction, Review],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
