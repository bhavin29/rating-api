import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailStatus, EmailType } from '../../../common/enums';
import { EmailLog } from '../../database/entities';

@Injectable()
export class EmailService {
  constructor(@InjectRepository(EmailLog) private readonly emailLogRepository: Repository<EmailLog>) {}

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
}
