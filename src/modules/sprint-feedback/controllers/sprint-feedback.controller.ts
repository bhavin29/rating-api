import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
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
  async verifyPin(
    @Body() input: VerifySprintFeedbackPinInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: boolean; message?: string }> {
    const result = await this.sprintFeedbackService.verifyPin(
      input.userId,
      input.pin,
    );

    if (result.success) {
      response.cookie('sprint_auth', input.userId, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 28800 * 1000,
      });
    }

    return result;
  }
}
