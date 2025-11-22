import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1710000000000 implements MigrationInterface {
  name = 'InitSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email varchar(160) UNIQUE NOT NULL,
        full_name varchar(160) NOT NULL,
        role varchar(20) NOT NULL DEFAULT 'PATIENT',
        is_profile_complete boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE therapists (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id),
        average_rating numeric(3,2) NOT NULL DEFAULT 0,
        total_reviews integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE packages (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(120) NOT NULL,
        session_count integer NOT NULL,
        total_price numeric(12,2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE booking_status AS ENUM ('PENDING', 'PAID', 'COMPLETED');
      CREATE TABLE bookings (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES users(id),
        therapist_id uuid NOT NULL REFERENCES therapists(id),
        package_id uuid REFERENCES packages(id),
        locked_address text NOT NULL,
        total_price numeric(12,2) NOT NULL,
        admin_fee_amount numeric(12,2) NOT NULL DEFAULT 0,
        therapist_net_total numeric(12,2) NOT NULL,
        status booking_status NOT NULL DEFAULT 'PENDING',
        chat_locked_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE session_status AS ENUM ('PENDING_SCHEDULING', 'SCHEDULED', 'COMPLETED', 'FORFEITED', 'EXPIRED');
      CREATE TABLE sessions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        therapist_id uuid NOT NULL REFERENCES therapists(id),
        sequence_order integer NOT NULL DEFAULT 1,
        scheduled_at timestamptz NULL,
        status session_status NOT NULL DEFAULT 'PENDING_SCHEDULING',
        is_payout_distributed boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE wallets (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        therapist_id uuid NOT NULL UNIQUE REFERENCES therapists(id),
        balance numeric(12,2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE wallet_tx_type AS ENUM ('CREDIT', 'DEBIT');
      CREATE TYPE wallet_tx_category AS ENUM ('SESSION_FEE', 'FORFEIT_COMPENSATION', 'WITHDRAWAL');
      CREATE TABLE wallet_transactions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        amount numeric(12,2) NOT NULL,
        type wallet_tx_type NOT NULL,
        category wallet_tx_category NULL,
        admin_note text NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE reviews (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        therapist_id uuid NOT NULL REFERENCES therapists(id),
        rating smallint NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE reviews`);
    await queryRunner.query(`DROP TABLE wallet_transactions`);
    await queryRunner.query(`DROP TYPE wallet_tx_category`);
    await queryRunner.query(`DROP TYPE wallet_tx_type`);
    await queryRunner.query(`DROP TABLE wallets`);
    await queryRunner.query(`DROP TABLE sessions`);
    await queryRunner.query(`DROP TYPE session_status`);
    await queryRunner.query(`DROP TABLE bookings`);
    await queryRunner.query(`DROP TYPE booking_status`);
    await queryRunner.query(`DROP TABLE packages`);
    await queryRunner.query(`DROP TABLE therapists`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
