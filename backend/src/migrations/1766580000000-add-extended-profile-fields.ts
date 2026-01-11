import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtendedProfileFields1766580000000 implements MigrationInterface {
    name = 'AddExtendedProfileFields1766580000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add patient profile fields to users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birth_date" DATE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blood_type" VARCHAR(5)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "allergies" TEXT`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "medical_history" TEXT`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergency_contact_name" VARCHAR(160)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" VARCHAR(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "height" INTEGER`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weight" INTEGER`);

        // Add therapist profile fields to therapists table
        await queryRunner.query(`ALTER TABLE "therapists" ADD COLUMN IF NOT EXISTS "birth_date" DATE`);
        await queryRunner.query(`ALTER TABLE "therapists" ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10)`);
        await queryRunner.query(`ALTER TABLE "therapists" ADD COLUMN IF NOT EXISTS "str_expiry_date" DATE`);
        await queryRunner.query(`ALTER TABLE "therapists" ADD COLUMN IF NOT EXISTS "education" VARCHAR(100)`);
        await queryRunner.query(`ALTER TABLE "therapists" ADD COLUMN IF NOT EXISTS "certifications" TEXT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove patient profile fields from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "birth_date"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "gender"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "blood_type"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "allergies"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "medical_history"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emergency_contact_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emergency_contact_phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "height"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "weight"`);

        // Remove therapist profile fields from therapists table
        await queryRunner.query(`ALTER TABLE "therapists" DROP COLUMN IF EXISTS "birth_date"`);
        await queryRunner.query(`ALTER TABLE "therapists" DROP COLUMN IF EXISTS "gender"`);
        await queryRunner.query(`ALTER TABLE "therapists" DROP COLUMN IF EXISTS "str_expiry_date"`);
        await queryRunner.query(`ALTER TABLE "therapists" DROP COLUMN IF EXISTS "education"`);
        await queryRunner.query(`ALTER TABLE "therapists" DROP COLUMN IF EXISTS "certifications"`);
    }
}
