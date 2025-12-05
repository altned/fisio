import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMidtransWebhookLog1710000005000 implements MigrationInterface {
  name = 'CreateMidtransWebhookLog1710000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS midtrans_webhook_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id varchar(64) NOT NULL,
        booking_id uuid NULL,
        payment_status varchar(20) NOT NULL,
        transaction_status varchar(30) NOT NULL,
        raw_payload jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS midtrans_webhook_logs`);
  }
}
