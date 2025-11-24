import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatActive1710000004000 implements MigrationInterface {
  name = 'AddChatActive1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE bookings ADD COLUMN is_chat_active boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN is_chat_active`);
  }
}
