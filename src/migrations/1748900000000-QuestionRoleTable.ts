import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuestionRoleTable1748900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.question_role
      (
          id          UUID      NOT NULL DEFAULT gen_random_uuid(),
          question_id UUID      NOT NULL,
          role_id     UUID      NOT NULL,
          is_active   BOOLEAN   NOT NULL DEFAULT TRUE,
          created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
          created_by  UUID      NULL,
          updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_by  UUID      NULL,

          CONSTRAINT question_role_pkey
              PRIMARY KEY (id),

          CONSTRAINT question_role_question_id_role_id_key
              UNIQUE (question_id, role_id),

          CONSTRAINT question_role_question_id_fkey
              FOREIGN KEY (question_id)
              REFERENCES public.questions (id)
              ON UPDATE NO ACTION
              ON DELETE CASCADE,

          CONSTRAINT question_role_role_id_fkey
              FOREIGN KEY (role_id)
              REFERENCES public.roles (id)
              ON UPDATE NO ACTION
              ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_question_role_question_id
          ON public.question_role (question_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_question_role_role_id
          ON public.question_role (role_id)
    `);

    // Backfill existing role associations
    await queryRunner.query(`
      INSERT INTO public.question_role (question_id, role_id)
      SELECT id, role_id
      FROM public.questions
      WHERE role_id IS NOT NULL
      ON CONFLICT (question_id, role_id) DO NOTHING
    `);

    // Drop the old index and column (FK constraint drops automatically with the column)
    await queryRunner.query(`DROP INDEX IF EXISTS public.idx_questions_role_id`);

    await queryRunner.query(`
      ALTER TABLE public.questions
          DROP COLUMN IF EXISTS role_id
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.questions
          ADD COLUMN IF NOT EXISTS role_id UUID NULL
    `);

    await queryRunner.query(`
      ALTER TABLE public.questions
          ADD CONSTRAINT questions_role_id_fkey
              FOREIGN KEY (role_id)
              REFERENCES public.roles (id)
              ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_role_id
          ON public.questions (role_id)
    `);

    // Restore one role per question from question_role (earliest row)
    await queryRunner.query(`
      UPDATE public.questions q
      SET role_id = qr.role_id
      FROM (
          SELECT DISTINCT ON (question_id) question_id, role_id
          FROM public.question_role
          ORDER BY question_id, created_at
      ) qr
      WHERE q.id = qr.question_id
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS public.question_role`);
  }
}
