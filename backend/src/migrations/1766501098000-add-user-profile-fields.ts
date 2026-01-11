import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileFields1766501098000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
            ADD COLUMN IF NOT EXISTS address TEXT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS phone_number,
            DROP COLUMN IF EXISTS address
        `);
    }
}
