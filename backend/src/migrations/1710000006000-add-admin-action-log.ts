import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminActionLog1710000006000 implements MigrationInterface {
  name = 'AddAdminActionLog1710000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE admin_action_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id uuid NULL,
        action varchar(80) NOT NULL,
        target_type varchar(80) NOT NULL,
        target_id uuid NOT NULL,
        meta jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE admin_action_logs`);
  }
}
