import { MigrationInterface, QueryRunner } from 'typeorm';

// Clears all existing security PINs so they are regenerated with the new
// 2-letter + 4-digit format on the next call to regenerateAllSecurityPins.
export class ClearSecurityPins1748990000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE public.users
      SET security_code_hash       = NULL,
          security_code_enabled    = FALSE,
          security_code_expires_at = NULL,
          failed_security_attempts = 0,
          security_locked_until    = NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Clearing PINs is not reversible — down is intentionally a no-op.
  }
}
