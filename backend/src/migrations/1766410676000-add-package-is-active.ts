import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPackageIsActive1766410676000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE packages 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE packages DROP COLUMN IF EXISTS is_active
        `);
    }
}
