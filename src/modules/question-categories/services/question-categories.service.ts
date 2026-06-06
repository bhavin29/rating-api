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
import { QuestionCategory } from "../../database/entities";
import { CreateQuestionCategoryInput } from "../dto/create-question-category.input";
import { QuestionCategoriesQueryArgs } from "../dto/question-categories-query.args";
import { ToggleQuestionCategoryStatusInput } from "../dto/toggle-question-category-status.input";
import { UpdateQuestionCategoryInput } from "../dto/update-question-category.input";

@Injectable()
export class QuestionCategoriesService {
  private readonly cache = new TtlCache<Promise<QuestionCategory[]>>(30_000);

  constructor(
    @InjectRepository(QuestionCategory)
    private readonly categoryRepository: Repository<QuestionCategory>,
    private readonly auditService: AuditService,
  ) {}

  getQuestionCategories(
    args: QuestionCategoriesQueryArgs,
  ): Promise<QuestionCategory[]> {
    const where = {
      ...(args.search ? { name: ILike(`%${args.search.trim()}%`) } : {}),
      ...(args.isActive !== undefined ? { isActive: args.isActive } : {}),
    };

    const cacheKey = `list:${JSON.stringify({
      search: args.search?.trim() ?? null,
      isActive: args.isActive ?? null,
      skip: args.skip ?? 0,
      take: args.take ?? 20,
    })}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    return this.cache.set(
      cacheKey,
      this.categoryRepository.find({
        where,
        order: { name: "ASC" },
        skip: args.skip,
        take: args.take,
      }),
    );
  }

  async getQuestionCategoryById(id: string): Promise<QuestionCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException("Question category not found");
    }
    return category;
  }

  async createQuestionCategory(
    input: CreateQuestionCategoryInput,
    actorId: string,
  ): Promise<QuestionCategory> {
    await this.ensureNameUnique(input.name);

    const category = this.categoryRepository.create({
      name: input.name.trim(),
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    });

    const created = await this.categoryRepository.save(category);
    this.cache.clear();
    await this.auditService.log(
      AuditAction.CREATE_QUESTION_CATEGORY,
      actorId,
      { categoryId: created.id, name: created.name },
    );
    return created;
  }

  async updateQuestionCategory(
    input: UpdateQuestionCategoryInput,
    actorId: string,
  ): Promise<QuestionCategory> {
    const category = await this.getQuestionCategoryById(input.id);

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) {
        throw new BadRequestException("Category name is required");
      }
      if (trimmed !== category.name) {
        await this.ensureNameUnique(trimmed);
      }
      category.name = trimmed;
    }

    if (input.description !== undefined) {
      category.description = input.description ?? null;
    }

    if (input.isActive !== undefined) {
      category.isActive = input.isActive;
    }

    const updated = await this.categoryRepository.save(category);
    this.cache.clear();
    await this.auditService.log(
      AuditAction.UPDATE_QUESTION_CATEGORY,
      actorId,
      { categoryId: updated.id, name: updated.name },
    );
    return updated;
  }

  async deleteQuestionCategory(
    id: string,
    actorId: string,
  ): Promise<boolean> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException("Question category not found");
    }

    await this.categoryRepository.remove(category);
    this.cache.clear();
    await this.auditService.log(
      AuditAction.DELETE_QUESTION_CATEGORY,
      actorId,
      { categoryId: id, name: category.name },
    );
    return true;
  }

  async toggleQuestionCategoryStatus(
    input: ToggleQuestionCategoryStatusInput,
    actorId: string,
  ): Promise<QuestionCategory> {
    const category = await this.getQuestionCategoryById(input.id);
    category.isActive = input.isActive;
    const updated = await this.categoryRepository.save(category);
    this.cache.clear();
    await this.auditService.log(
      AuditAction.TOGGLE_QUESTION_CATEGORY_STATUS,
      actorId,
      { categoryId: updated.id, isActive: updated.isActive },
    );
    return updated;
  }

  private async ensureNameUnique(name: string): Promise<void> {
    const existing = await this.categoryRepository.findOne({
      where: { name: name.trim() },
    });
    if (existing) {
      throw new ConflictException(
        `A question category with the name "${name.trim()}" already exists`,
      );
    }
  }
}
