import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, ProjectMember, Role, User } from '../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { UsersResolver } from './resolvers/users.resolver';
import { UsersService } from './services/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Project, ProjectMember]), AuthModule, RbacModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
