import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationCoordinates1766588000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add coordinates to therapists table
        await queryRunner.query(`
      ALTER TABLE therapists 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7)
    `);

        // Add coordinates to users table
        await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE therapists 
      DROP COLUMN IF EXISTS latitude,
      DROP COLUMN IF EXISTS longitude
    `);

        await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS latitude,
      DROP COLUMN IF EXISTS longitude
    `);
    }
}
