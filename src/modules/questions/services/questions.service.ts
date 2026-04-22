import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Question, Role } from '../../database/entities';
import { CreateQuestionInput } from '../dto/create-question.input';
import { QuestionsQueryArgs } from '../dto/questions-query.args';
import { ToggleQuestionStatusInput } from '../dto/toggle-question-status.input';
import { UpdateQuestionInput } from '../dto/update-question.input';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {}

  getQuestionsByRole(roleId: string): Promise<Question[]> {
    return this.questionRepository.find({ where: { roleId, isActive: true }, order: { text: 'ASC' } });
  }

  getQuestions(args: QuestionsQueryArgs): Promise<Question[]> {
    const where = {
      ...(args.search ? { text: ILike(`%${args.search.trim()}%`) } : {}),
      ...(args.roleId ? { roleId: args.roleId } : {}),
      ...(args.isActive !== undefined ? { isActive: args.isActive } : {}),
    };

    return this.questionRepository.find({
      where,
      order: { text: 'ASC' },
      skip: args.skip,
      take: args.take,
    });
  }

  async getQuestionById(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    await this.ensureRoleExists(input.roleId);

    const question = this.questionRepository.create({
      text: this.normalizeQuestionText(input.text),
      roleId: input.roleId,
      isActive: input.isActive ?? true,
    });

    return this.questionRepository.save(question);
  }

  async updateQuestion(input: UpdateQuestionInput): Promise<Question> {
    const question = await this.getQuestionById(input.id);

    if (input.roleId !== undefined) {
      await this.ensureRoleExists(input.roleId);
      question.roleId = input.roleId;
    }

    if (input.text !== undefined) {
      question.text = this.normalizeQuestionText(input.text);
    }

    if (input.isActive !== undefined) {
      question.isActive = input.isActive;
    }

    return this.questionRepository.save(question);
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const question = await this.questionRepository.findOne({ where: { id }, relations: { answers: true } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.answers.length > 0) {
      throw new ConflictException('Question cannot be deleted because it is used in ratings');
    }

    await this.questionRepository.remove(question);
    return true;
  }

  async toggleQuestionStatus(input: ToggleQuestionStatusInput): Promise<Question> {
    const question = await this.getQuestionById(input.id);
    question.isActive = input.isActive;
    return this.questionRepository.save(question);
  }

  private async ensureRoleExists(roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
  }

  private normalizeQuestionText(text: string): string {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw new BadRequestException('Question text is required');
    }

    return normalizedText;
  }
}
