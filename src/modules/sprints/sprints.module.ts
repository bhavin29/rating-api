import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint, SprintMember, User } from '../database/entities';
import { SprintsResolver } from './resolvers/sprints.resolver';
import { SprintsService } from './services/sprints.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, SprintMember, User]), AuditModule],
  providers: [SprintsResolver, SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
