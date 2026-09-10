import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripePriceIdToPlans1788115200000 implements MigrationInterface {
  name = 'AddStripePriceIdToPlans1788115200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "stripe_price_id" varchar(255)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "stripe_price_id"',
    );
  }
}
