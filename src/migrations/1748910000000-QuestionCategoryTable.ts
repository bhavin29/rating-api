import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuestionCategoryTable1748910000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.question_category
      (
          id          UUID         NOT NULL DEFAULT gen_random_uuid(),
          name        VARCHAR(255) NOT NULL,
          description TEXT         NULL,
          is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
          created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
          created_by  UUID         NULL,
          updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
          updated_by  UUID         NULL,

          CONSTRAINT question_category_pkey
              PRIMARY KEY (id),

          CONSTRAINT question_category_name_key
              UNIQUE (name)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_question_category_name
          ON public.question_category (name)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_question_category_is_active
          ON public.question_category (is_active)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.question_category`);
  }
}
