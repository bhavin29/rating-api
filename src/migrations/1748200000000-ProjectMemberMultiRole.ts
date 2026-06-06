import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectMemberMultiRole1748200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old unique constraint (project_id, user_id)
    await queryRunner.query(`
      ALTER TABLE public.project_members
        DROP CONSTRAINT IF EXISTS uq_project_member
    `);

    // Add allocation_percentage column
    await queryRunner.query(`
      ALTER TABLE public.project_members
        ADD COLUMN IF NOT EXISTS allocation_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
        CONSTRAINT chk_allocation_percentage CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
    `);

    // Add new unique constraint allowing same user with different roles
    await queryRunner.query(`
      ALTER TABLE public.project_members
        ADD CONSTRAINT uq_project_member_role UNIQUE (project_id, user_id, role_id)
    `);

    // Partial unique index: prevent duplicate null-role entries for same user+project
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_project_member_no_role
        ON public.project_members (project_id, user_id)
        WHERE role_id IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS public.uq_project_member_no_role`);
    await queryRunner.query(`
      ALTER TABLE public.project_members
        DROP CONSTRAINT IF EXISTS uq_project_member_role
    `);
    await queryRunner.query(`
      ALTER TABLE public.project_members
        DROP COLUMN IF EXISTS allocation_percentage
    `);
    await queryRunner.query(`
      ALTER TABLE public.project_members
        ADD CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
    `);
  }
}
