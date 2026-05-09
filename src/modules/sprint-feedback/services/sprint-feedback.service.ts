import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailStatus, EmailType } from '../../../common/enums';
import { EmailService } from '../../email/services/email.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class SprintFeedbackService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(userId: string): Promise<{ ok: true }> {
    const { user, plainPin } = await this.usersService.generateAndSaveSecurityPin(userId);
    const portalUrl = this.buildPortalUrl(user.id);
    const organizationName = this.configService.get<string>('ORGANIZATION_NAME', 'Your Organization Name');
    const subject = 'Sprint Feedback Login Details';
    const body = this.buildEmailBody(user.name, portalUrl, plainPin, organizationName);

    try {
      await this.emailService.sendEmail(user.email, subject, body);
      await this.emailService.logEmail(user.email, EmailType.SPRINT_FEEDBACK, EmailStatus.SENT);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send sprint feedback email';
      await this.emailService.logEmail(user.email, EmailType.SPRINT_FEEDBACK, EmailStatus.FAILED, message);
      throw error;
    }

    return { ok: true };
  }

  async verifyPin(userId: string, pin: string): Promise<{ success: boolean; message?: string }> {
    try {
      const isValid = await this.usersService.verifySecurityPin(userId, pin);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid PIN',
        };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        const response = error.getResponse();
        const message =
          typeof response === 'object' && response !== null && 'message' in response
            ? String(response.message)
            : error.message;

        if (message.startsWith('Account is locked until')) {
          throw new HttpException(
            {
              success: false,
              message: 'Too many failed attempts. Please try again later.',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        return {
          success: false,
          message,
        };
      }

      throw error;
    }
  }

  private buildPortalUrl(userId: string): string {
    const portalBaseUrl = this.configService.get<string>('PORTAL_URL', 'http://localhost:3000').replace(/\/+$/, '');
    return `${portalBaseUrl}/feedback-auth?user=${encodeURIComponent(userId)}`;
  }

  private buildEmailBody(userName: string, portalUrl: string, securityPin: string, organizationName: string): string {
    return `Dear ${userName},

You have been invited to provide Sprint Feedback for your team members.

Please use the below details to log in to the Sprint Feedback Portal:

Portal Link: ${portalUrl}
Security PIN: ${securityPin}

Steps:

1. Open the Sprint Feedback Portal
2. Enter your Security PIN
3. Select your project and sprint
4. Submit your feedback

Your feedback is valuable and will help improve team collaboration and performance.

If you face any issues while logging in, please contact the support team.

Regards,
${organizationName}`;
  }
}
