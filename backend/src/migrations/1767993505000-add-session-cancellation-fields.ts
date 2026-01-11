import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionCancellationFields1767993505000 implements MigrationInterface {
    name = 'AddSessionCancellationFields1767993505000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS cancellation_reason text,
      ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS cancelled_by varchar(20)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE sessions 
      DROP COLUMN IF EXISTS cancellation_reason,
      DROP COLUMN IF EXISTS cancelled_at,
      DROP COLUMN IF EXISTS cancelled_by
    `);
    }
}
