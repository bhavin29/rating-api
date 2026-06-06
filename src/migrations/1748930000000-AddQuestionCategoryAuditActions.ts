import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionCategoryAuditActions1748930000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'CREATE_QUESTION_CATEGORY'`);
    await queryRunner.query(`ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'UPDATE_QUESTION_CATEGORY'`);
    await queryRunner.query(`ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DELETE_QUESTION_CATEGORY'`);
    await queryRunner.query(`ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'TOGGLE_QUESTION_CATEGORY_STATUS'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing values from an enum.
    // To roll back, recreate the enum without these values and update the column.
  }
}
