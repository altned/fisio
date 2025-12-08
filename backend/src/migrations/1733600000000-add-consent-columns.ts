import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConsentColumns1733600000000 implements MigrationInterface {
    name = 'AddConsentColumns1733600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE bookings
      ADD COLUMN consent_service boolean NOT NULL DEFAULT false,
      ADD COLUMN consent_data_sharing boolean NOT NULL DEFAULT false,
      ADD COLUMN consent_terms boolean NOT NULL DEFAULT false,
      ADD COLUMN consent_medical_disclaimer boolean NOT NULL DEFAULT false,
      ADD COLUMN consent_version varchar(20) NULL,
      ADD COLUMN consented_at timestamp with time zone NULL
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE bookings
      DROP COLUMN consent_service,
      DROP COLUMN consent_data_sharing,
      DROP COLUMN consent_terms,
      DROP COLUMN consent_medical_disclaimer,
      DROP COLUMN consent_version,
      DROP COLUMN consented_at
    `);
    }
}
