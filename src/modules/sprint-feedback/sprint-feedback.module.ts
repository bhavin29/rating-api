import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";
import { AdminSession } from "../database/entities";
import { SprintFeedbackController } from "./controllers/sprint-feedback.controller";
import { SprintFeedbackService } from "./services/sprint-feedback.service";

@Module({
  imports: [TypeOrmModule.forFeature([AdminSession]), AuthModule, UsersModule, EmailModule, AuditModule],
  controllers: [SprintFeedbackController],
  providers: [SprintFeedbackService],
})
export class SprintFeedbackModule {}
