import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordHash1733500000000 implements MigrationInterface {
    name = 'AddPasswordHash1733500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(160) NULL
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"
    `);
    }
}
