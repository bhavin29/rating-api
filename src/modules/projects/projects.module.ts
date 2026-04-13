import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, ProjectMember, User } from '../database/entities';
import { ProjectsResolver } from './resolvers/projects.resolver';
import { ProjectsService } from './services/projects.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, User]), AuditModule, AuthModule, RbacModule],
  providers: [ProjectsResolver, ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
