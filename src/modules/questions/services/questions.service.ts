import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../../database/entities';

@Injectable()
export class QuestionsService {
  constructor(@InjectRepository(Question) private readonly questionRepository: Repository<Question>) {}

  getQuestionsByRole(roleId: string): Promise<Question[]> {
    return this.questionRepository.find({ where: { roleId, isActive: true } });
  }
}
