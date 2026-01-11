import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionCompletionPhoto1768139400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS completion_photo_url TEXT
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE sessions DROP COLUMN IF EXISTS completion_photo_url
    `);
    }
}
