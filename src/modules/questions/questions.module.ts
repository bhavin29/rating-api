import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project, Question, Role, Sprint } from "../database/entities";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { RbacModule } from "../rbac/rbac.module";
import { QuestionsResolver } from "./resolvers/questions.resolver";
import { QuestionsService } from "./services/questions.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Role, Project, Sprint]),
    AuditModule,
    AuthModule,
    RbacModule,
  ],
  providers: [QuestionsResolver, QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
