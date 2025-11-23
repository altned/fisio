import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundColumns1710000003000 implements MigrationInterface {
  name = 'AddRefundColumns1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE bookings 
        ADD COLUMN refund_status varchar(20) NOT NULL DEFAULT 'NONE',
        ADD COLUMN refund_reference varchar(160) NULL,
        ADD COLUMN refund_note text NULL,
        ADD COLUMN refunded_at timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE bookings 
        DROP COLUMN refund_status,
        DROP COLUMN refund_reference,
        DROP COLUMN refund_note,
        DROP COLUMN refunded_at`,
    );
  }
}
