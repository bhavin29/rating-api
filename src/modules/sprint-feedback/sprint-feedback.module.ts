import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";
import { SprintFeedbackController } from "./controllers/sprint-feedback.controller";
import { SprintFeedbackService } from "./services/sprint-feedback.service";

@Module({
  imports: [AuthModule, UsersModule, EmailModule, AuditModule],
  controllers: [SprintFeedbackController],
  providers: [SprintFeedbackService],
})
export class SprintFeedbackModule {}
