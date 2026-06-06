import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityCodeExpiresAt1748980000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS security_code_expires_at TIMESTAMP NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
        DROP COLUMN IF EXISTS security_code_expires_at
    `);
  }
}
