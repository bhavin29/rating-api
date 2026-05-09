import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { SprintFeedbackController } from './controllers/sprint-feedback.controller';
import { SprintFeedbackService } from './services/sprint-feedback.service';

@Module({
  imports: [UsersModule, EmailModule],
  controllers: [SprintFeedbackController],
  providers: [SprintFeedbackService],
})
export class SprintFeedbackModule {}
