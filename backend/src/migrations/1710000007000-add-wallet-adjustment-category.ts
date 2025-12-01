import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletAdjustmentCategory1710000007000 implements MigrationInterface {
  name = 'AddWalletAdjustmentCategory1710000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE wallet_tx_category ADD VALUE IF NOT EXISTS 'ADJUSTMENT'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No safe down migration for enum value removal
  }
}
