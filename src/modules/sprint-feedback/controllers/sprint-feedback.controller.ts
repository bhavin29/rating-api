import { Body, Controller, Post } from '@nestjs/common';
import { SendSprintFeedbackEmailInput } from '../dto/send-sprint-feedback-email.input';
import { VerifySprintFeedbackPinInput } from '../dto/verify-sprint-feedback-pin.input';
import { SprintFeedbackService } from '../services/sprint-feedback.service';

@Controller('api/sprint-feedback')
export class SprintFeedbackController {
  constructor(private readonly sprintFeedbackService: SprintFeedbackService) {}

  @Post('send-email')
  sendEmail(@Body() input: SendSprintFeedbackEmailInput): Promise<{ ok: true }> {
    return this.sprintFeedbackService.sendEmail(input.userId);
  }

  @Post('verify-pin')
  verifyPin(@Body() input: VerifySprintFeedbackPinInput): Promise<{ success: boolean; message?: string }> {
    return this.sprintFeedbackService.verifyPin(input.userId, input.pin);
  }
}
