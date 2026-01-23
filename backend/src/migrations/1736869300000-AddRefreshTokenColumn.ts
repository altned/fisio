import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenColumn1736869300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(500) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS refresh_token
        `);
    }
}
