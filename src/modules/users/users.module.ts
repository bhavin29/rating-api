import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AdminSession,
  Project,
  ProjectMember,
  Role,
  User,
} from "../database/entities";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { RbacModule } from "../rbac/rbac.module";
import { UsersResolver } from "./resolvers/users.resolver";
import { UsersService } from "./services/users.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminSession, User, Role, Project, ProjectMember]),
    AuditModule,
    AuthModule,
    RbacModule,
  ],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
