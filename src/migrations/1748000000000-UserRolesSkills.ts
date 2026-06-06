import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserRolesSkills1748000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id  UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
        level    VARCHAR(3) CHECK (level IN ('1','2','3','1+','2+','3+')),
        UNIQUE (user_id, role_id)
      )
    `);

    await queryRunner.query(`
      INSERT INTO skills (name) VALUES
        -- Frontend
        ('React'),
        ('Angular'),
        ('Vue.js'),
        ('Next.js'),
        ('TypeScript'),
        ('JavaScript'),
        ('HTML/CSS'),
        -- Backend
        ('Node.js'),
        ('NestJS'),
        ('Python'),
        ('Java'),
        ('.NET / C#'),
        ('Spring Boot'),
        ('Django'),
        ('Express.js'),
        -- Mobile
        ('React Native'),
        ('Flutter'),
        ('iOS / Swift'),
        ('Android / Kotlin'),
        -- Database
        ('PostgreSQL'),
        ('MySQL'),
        ('MongoDB'),
        ('Redis'),
        ('SQL Server'),
        -- DevOps & Cloud
        ('Docker'),
        ('Kubernetes'),
        ('AWS'),
        ('Azure'),
        ('GCP'),
        ('CI/CD'),
        -- Testing
        ('Jest'),
        ('Cypress'),
        ('Selenium'),
        -- Architecture & Practices
        ('GraphQL'),
        ('REST API'),
        ('Microservices'),
        ('System Design'),
        ('Agile / Scrum'),
        ('Git')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS skills`);
  }
}
