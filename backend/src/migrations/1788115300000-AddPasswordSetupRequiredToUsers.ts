import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordSetupRequiredToUsers1788115300000 implements MigrationInterface {
  name = 'AddPasswordSetupRequiredToUsers1788115300000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_setup_required" boolean NOT NULL DEFAULT false',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "password_setup_required"',
    );
  }
}
