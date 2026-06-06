import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminSession, QuestionCategory } from "../database/entities";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { RbacModule } from "../rbac/rbac.module";
import { QuestionCategoriesResolver } from "./resolvers/question-categories.resolver";
import { QuestionCategoriesService } from "./services/question-categories.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminSession, QuestionCategory]),
    AuditModule,
    AuthModule,
    RbacModule,
  ],
  providers: [QuestionCategoriesResolver, QuestionCategoriesService],
  exports: [QuestionCategoriesService],
})
export class QuestionCategoriesModule {}
