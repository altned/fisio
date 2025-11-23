import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentColumns1710000001000 implements MigrationInterface {
  name = 'AddPaymentColumns1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE bookings ADD COLUMN payment_method varchar(20) NULL, ADD COLUMN payment_proof_url text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE bookings DROP COLUMN payment_method, DROP COLUMN payment_proof_url`,
    );
  }
}
