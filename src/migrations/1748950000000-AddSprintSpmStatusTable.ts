import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSprintSpmStatusTable1748950000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.sprint_spm_status
      (
          spm_id       UUID         NOT NULL,
          status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
          submitted_at TIMESTAMP    NULL,
          submitted_by UUID         NULL,
          updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

          CONSTRAINT sprint_spm_status_pkey PRIMARY KEY (spm_id),
          CONSTRAINT sprint_spm_status_status_check CHECK (status IN ('DRAFT', 'SUBMITTED'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.sprint_spm_status`);
  }
}
