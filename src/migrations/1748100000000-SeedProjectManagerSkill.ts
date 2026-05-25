import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProjectManagerSkill1748100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO skills (name) VALUES
        ('Project Planning'),
        ('Risk Management'),
        ('Stakeholder Management'),
        ('Resource Management'),
        ('Budget Management'),
        ('Change Management'),
        ('Team Leadership'),
        ('Jira'),
        ('Confluence'),
        ('MS Project'),
        ('Kanban'),
        ('Waterfall'),
        ('PMP / PRINCE2'),
        ('Scope Management'),
        ('Vendor Management')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM skills WHERE name IN (
        'Project Planning', 'Risk Management', 'Stakeholder Management',
        'Resource Management', 'Budget Management', 'Change Management',
        'Team Leadership', 'Jira', 'Confluence', 'MS Project',
        'Kanban', 'Waterfall', 'PMP / PRINCE2', 'Scope Management', 'Vendor Management'
      )
    `);
  }
}
