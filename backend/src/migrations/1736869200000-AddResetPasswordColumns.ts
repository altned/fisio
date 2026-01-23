import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordColumns1736869200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_token VARCHAR(10) NULL,
            ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS reset_token,
            DROP COLUMN IF EXISTS reset_token_expiry
        `);
    }
}
