import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1715450000000 implements MigrationInterface {
  name = 'InitSchema1715450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Initial schema migration script goes here.
    // Run \`npm run migration:generate\` once the database is up.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback script goes here.
  }
}
