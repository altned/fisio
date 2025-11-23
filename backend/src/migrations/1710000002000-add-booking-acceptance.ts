import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingAcceptance1710000002000 implements MigrationInterface {
  name = 'AddBookingAcceptance1710000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'CANCELLED'`);
    await queryRunner.query(
      `ALTER TABLE bookings ADD COLUMN booking_type varchar(20) NOT NULL DEFAULT 'REGULAR'`,
    );
    await queryRunner.query(
      `ALTER TABLE bookings ADD COLUMN therapist_respond_by timestamptz NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE bookings ADD COLUMN therapist_accepted_at timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN therapist_accepted_at`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN therapist_respond_by`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN booking_type`);
    // Note: dropping enum value 'CANCELLED' is not straightforward; left as is.
  }
}
