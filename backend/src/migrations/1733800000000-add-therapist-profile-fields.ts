import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistProfileFields1733800000000 implements MigrationInterface {
    name = 'AddTherapistProfileFields1733800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE therapists 
      ADD COLUMN IF NOT EXISTS bidang VARCHAR(100),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS str_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE therapists 
      DROP COLUMN IF EXISTS bidang,
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS address,
      DROP COLUMN IF EXISTS photo_url,
      DROP COLUMN IF EXISTS str_number,
      DROP COLUMN IF EXISTS experience_years,
      DROP COLUMN IF EXISTS bio,
      DROP COLUMN IF EXISTS is_active
    `);
    }
}
