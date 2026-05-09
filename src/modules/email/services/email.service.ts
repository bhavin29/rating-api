import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createTransport } from 'nodemailer';
import { Repository } from 'typeorm';
import { EmailStatus, EmailType } from '../../../common/enums';
import { EmailLog } from '../../database/entities';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailLog) private readonly emailLogRepository: Repository<EmailLog>,
    private readonly configService: ConfigService,
  ) {}

  async logEmail(toEmail: string, type: EmailType, status: EmailStatus, error?: string): Promise<EmailLog> {
    return this.emailLogRepository.save(
      this.emailLogRepository.create({
        toEmail,
        type,
        status,
        error,
      }),
    );
  }

  async sendEmail(toEmail: string, subject: string, text: string): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      throw new Error('SMTP_HOST is not configured');
    }

    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    const from = this.configService.get<string>('SMTP_FROM') ?? user;
    const bcc = this.parseEmailList(this.configService.get<string>('SMTP_BCC'));

    if (!from) {
      throw new Error('SMTP_FROM or SMTP_USER is required');
    }

    const transport = createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transport.sendMail({
      from,
      to: toEmail,
      bcc,
      subject,
      text,
    });
  }

  private parseEmailList(value?: string): string[] | undefined {
    const emails = value
      ?.split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    return emails && emails.length > 0 ? emails : undefined;
  }
}
