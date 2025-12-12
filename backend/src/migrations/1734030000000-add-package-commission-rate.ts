import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageCommissionRate1734030000000 implements MigrationInterface {
    name = 'AddPackageCommissionRate1734030000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add commission_rate column to packages table with default 30%
        await queryRunner.query(`
            ALTER TABLE packages 
            ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 30
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE packages DROP COLUMN IF EXISTS commission_rate`);
    }
}
