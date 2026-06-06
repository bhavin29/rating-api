import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubmitSprintRatingAuditAction1748960000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'SUBMIT_SPRINT_RATING'`,
    );
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values.
  }
}
