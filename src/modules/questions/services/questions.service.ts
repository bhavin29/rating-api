import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { AuditAction } from "../../../common/enums";
import { TtlCache } from "../../../common/ttl-cache";
import { AuditService } from "../../audit/services/audit.service";
import { Project, Question, QuestionCategory, Sprint } from "../../database/entities";
import { CreateQuestionInput } from "../dto/create-question.input";
import { QuestionsQueryArgs } from "../dto/questions-query.args";
import { ToggleQuestionStatusInput } from "../dto/toggle-question-status.input";
import { UpdateQuestionInput } from "../dto/update-question.input";

@Injectable()
export class QuestionsService {
  private readonly questionsCache = new TtlCache<Promise<Question[]>>(30_000);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionCategory)
    private readonly categoryRepository: Repository<QuestionCategory>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    private readonly auditService: AuditService,
  ) {}

  getQuestions(args: QuestionsQueryArgs): Promise<Question[]> {
    const where = {
      ...(args.search ? { text: ILike(`%${args.search.trim()}%`) } : {}),
      ...(args.categoryId ? { categoryId: args.categoryId } : {}),
      ...(args.projectId ? { projectId: args.projectId } : {}),
      ...(args.sprintId ? { sprintId: args.sprintId } : {}),
      ...(args.isActive !== undefined ? { isActive: args.isActive } : {}),
    };

    const cacheKey = `list:${JSON.stringify({
      search: args.search?.trim() ?? null,
      categoryId: args.categoryId ?? null,
      projectId: args.projectId ?? null,
      sprintId: args.sprintId ?? null,
      isActive: args.isActive ?? null,
      skip: args.skip ?? 0,
      take: args.take ?? 20,
    })}`;
    const cached = this.questionsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    return this.questionsCache.set(
      cacheKey,
      this.questionRepository.find({
        where,
        order: { text: "ASC" },
        skip: args.skip,
        take: args.take,
      }),
    );
  }

  async getQuestionById(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    return question;
  }

  async createQuestion(
    input: CreateQuestionInput,
    actorId: string,
  ): Promise<Question> {
    await this.ensureCategoryExists(input.categoryId);
    await this.ensureProjectExists(input.projectId);
    await this.ensureSprintExists(input.sprintId);

    const question = this.questionRepository.create({
      text: this.normalizeQuestionText(input.text),
      categoryId: input.categoryId ?? null,
      projectId: input.projectId ?? null,
      sprintId: input.sprintId ?? null,
      isActive: input.isActive ?? true,
    });

    const createdQuestion = await this.questionRepository.save(question);
    this.questionsCache.clear();
    await this.auditService.log(AuditAction.CREATE_QUESTION, actorId, {
      questionId: createdQuestion.id,
      categoryId: createdQuestion.categoryId,
      projectId: createdQuestion.projectId,
      sprintId: createdQuestion.sprintId,
    });
    return createdQuestion;
  }

  async updateQuestion(
    input: UpdateQuestionInput,
    actorId: string,
  ): Promise<Question> {
    const question = await this.getQuestionById(input.id);

    if (input.categoryId !== undefined) {
      await this.ensureCategoryExists(input.categoryId);
      question.categoryId = input.categoryId;
    }

    if (input.projectId !== undefined) {
      await this.ensureProjectExists(input.projectId);
      question.projectId = input.projectId;
    }

    if (input.sprintId !== undefined) {
      await this.ensureSprintExists(input.sprintId);
      question.sprintId = input.sprintId;
    }

    if (input.text !== undefined) {
      question.text = this.normalizeQuestionText(input.text);
    }

    if (input.isActive !== undefined) {
      question.isActive = input.isActive;
    }

    const updatedQuestion = await this.questionRepository.save(question);
    this.questionsCache.clear();
    await this.auditService.log(AuditAction.UPDATE_QUESTION, actorId, {
      questionId: updatedQuestion.id,
      categoryId: updatedQuestion.categoryId,
      projectId: updatedQuestion.projectId,
      sprintId: updatedQuestion.sprintId,
      isActive: updatedQuestion.isActive,
    });
    return updatedQuestion;
  }

  async deleteQuestion(id: string, actorId: string): Promise<boolean> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: { answers: true },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    if (question.answers.length > 0) {
      throw new ConflictException(
        "Question cannot be deleted because it is used in ratings",
      );
    }

    await this.questionRepository.remove(question);
    this.questionsCache.clear();
    await this.auditService.log(AuditAction.DELETE_QUESTION, actorId, {
      questionId: id,
      projectId: question.projectId,
      sprintId: question.sprintId,
    });
    return true;
  }

  async toggleQuestionStatus(
    input: ToggleQuestionStatusInput,
    actorId: string,
  ): Promise<Question> {
    const question = await this.getQuestionById(input.id);
    question.isActive = input.isActive;
    const updatedQuestion = await this.questionRepository.save(question);
    this.questionsCache.clear();
    await this.auditService.log(AuditAction.TOGGLE_QUESTION_STATUS, actorId, {
      questionId: updatedQuestion.id,
      isActive: updatedQuestion.isActive,
    });
    return updatedQuestion;
  }

  private async ensureCategoryExists(
    categoryId?: string | null,
  ): Promise<void> {
    if (categoryId == null) {
      return;
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException("Question category not found");
    }
  }

  private async ensureProjectExists(projectId?: string | null): Promise<void> {
    if (projectId == null) {
      return;
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
  }

  private async ensureSprintExists(sprintId?: string | null): Promise<void> {
    if (sprintId == null) {
      return;
    }

    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });
    if (!sprint) {
      throw new NotFoundException("Sprint not found");
    }
  }

  private normalizeQuestionText(text: string): string {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw new BadRequestException("Question text is required");
    }

    return normalizedText;
  }
}
