import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionRoleAuditActions1748940000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ASSIGN_QUESTIONS_TO_ROLE'`);
    await queryRunner.query(`ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'REMOVE_QUESTION_FROM_ROLE'`);
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values.
  }
}
