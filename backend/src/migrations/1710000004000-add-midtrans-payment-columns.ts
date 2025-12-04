import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMidtransPaymentColumns1710000004000 implements MigrationInterface {
  name = 'AddMidtransPaymentColumns1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bookings
      ADD COLUMN payment_provider varchar(30) NOT NULL DEFAULT 'MIDTRANS',
      ADD COLUMN payment_status varchar(20) NOT NULL DEFAULT 'PENDING',
      ADD COLUMN payment_order_id varchar(64),
      ADD COLUMN payment_token varchar(160),
      ADD COLUMN payment_redirect_url text,
      ADD COLUMN payment_instruction jsonb,
      ADD COLUMN payment_expiry_time timestamp with time zone,
      ADD COLUMN payment_payload jsonb
    `);

    await queryRunner.query(`UPDATE bookings SET payment_status = 'PAID' WHERE status = 'PAID'`);
    await queryRunner.query(
      `UPDATE bookings SET payment_status = 'CANCELLED' WHERE status = 'CANCELLED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bookings
      DROP COLUMN payment_provider,
      DROP COLUMN payment_status,
      DROP COLUMN payment_order_id,
      DROP COLUMN payment_token,
      DROP COLUMN payment_redirect_url,
      DROP COLUMN payment_instruction,
      DROP COLUMN payment_expiry_time,
      DROP COLUMN payment_payload
    `);
  }
}
