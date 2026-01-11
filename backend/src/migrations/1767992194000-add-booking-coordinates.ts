import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingCoordinates1767992194000 implements MigrationInterface {
    name = 'AddBookingCoordinates1767992194000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
      ADD COLUMN IF NOT EXISTS longitude numeric(10,7)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE bookings 
      DROP COLUMN IF EXISTS latitude,
      DROP COLUMN IF EXISTS longitude
    `);
    }
}
