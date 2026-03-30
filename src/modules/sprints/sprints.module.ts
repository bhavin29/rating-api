import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint, SprintMember, User } from '../database/entities';
import { SprintsResolver } from './resolvers/sprints.resolver';
import { SprintsService } from './services/sprints.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, SprintMember, User]), AuditModule, AuthModule, RbacModule],
  providers: [SprintsResolver, SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
