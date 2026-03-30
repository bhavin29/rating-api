import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../../../common/enums';
import { AuditLog } from '../../database/entities';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>) {}

  async log(action: AuditAction, actorId?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.auditRepository.save(this.auditRepository.create({ action, actorId, metadata }));
  }
}
