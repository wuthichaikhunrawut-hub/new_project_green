import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoalsTable1715460000000 implements MigrationInterface {
  name = 'CreateGoalsTable1715460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organization_goals" (
        "goal_id" SERIAL PRIMARY KEY,
        "org_id" integer,
        "title" varchar(255) NOT NULL,
        "target_reduction_percent" double precision,
        "target_date" timestamp without time zone,
        "status" varchar(50) DEFAULT 'Active',
        "progress" double precision DEFAULT 0,
        "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_org_goals_organization" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "organization_goals"`);
  }
}
