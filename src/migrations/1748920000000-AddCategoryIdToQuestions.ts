import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryIdToQuestions1748920000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.questions
          ADD COLUMN IF NOT EXISTS category_id UUID NULL,
          ADD CONSTRAINT questions_category_id_fkey
              FOREIGN KEY (category_id)
              REFERENCES public.question_category (id)
              ON UPDATE NO ACTION
              ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_questions_category_id
          ON public.questions (category_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS public.idx_questions_category_id`);

    await queryRunner.query(`
      ALTER TABLE public.questions
          DROP CONSTRAINT IF EXISTS questions_category_id_fkey,
          DROP COLUMN IF EXISTS category_id
    `);
  }
}
