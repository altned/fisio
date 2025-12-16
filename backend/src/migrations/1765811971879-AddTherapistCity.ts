import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTherapistCity1765811971879 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE therapists
            ADD COLUMN IF NOT EXISTS city VARCHAR(100)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE therapists
            DROP COLUMN IF EXISTS city
        `);
    }
}
