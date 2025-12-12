import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionNotesAndReviewComment1734020000000 implements MigrationInterface {
    name = 'AddSessionNotesAndReviewComment1734020000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add therapist_notes to sessions table
        await queryRunner.query(`
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS therapist_notes TEXT
        `);

        // Add comment to reviews table
        await queryRunner.query(`
            ALTER TABLE reviews 
            ADD COLUMN IF NOT EXISTS comment TEXT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE sessions DROP COLUMN IF EXISTS therapist_notes`);
        await queryRunner.query(`ALTER TABLE reviews DROP COLUMN IF EXISTS comment`);
    }
}
