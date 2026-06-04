import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AdminSession,
  Question,
  QuestionCategory,
  QuestionRole,
  Role,
} from "../database/entities";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { RbacModule } from "../rbac/rbac.module";
import { QuestionRolesResolver } from "./resolvers/question-roles.resolver";
import { QuestionRolesService } from "./services/question-roles.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminSession,
      QuestionRole,
      Question,
      QuestionCategory,
      Role,
    ]),
    AuditModule,
    AuthModule,
    RbacModule,
  ],
  providers: [QuestionRolesResolver, QuestionRolesService],
  exports: [QuestionRolesService],
})
export class QuestionRolesModule {}
