import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFcmToken1710000005000 implements MigrationInterface {
  name = 'AddUserFcmToken1710000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN fcm_token text NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN fcm_token`);
  }
}
