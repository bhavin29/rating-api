import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSprintProjectId1748970000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.sprints
        DROP COLUMN IF EXISTS project_id
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.sprints
        ADD COLUMN IF NOT EXISTS project_id UUID NULL
    `);
  }
}
