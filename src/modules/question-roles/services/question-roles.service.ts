import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { AuditAction } from "../../../common/enums";
import { AuditService } from "../../audit/services/audit.service";
import {
  Question,
  QuestionCategory,
  QuestionRole,
  Role,
} from "../../database/entities";
import { AssignQuestionsToRoleInput } from "../dto/assign-questions-to-role.input";
import { RemoveQuestionFromRoleInput } from "../dto/remove-question-from-role.input";

@Injectable()
export class QuestionRolesService {
  constructor(
    @InjectRepository(QuestionRole)
    private readonly questionRoleRepository: Repository<QuestionRole>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(QuestionCategory)
    private readonly categoryRepository: Repository<QuestionCategory>,
    private readonly auditService: AuditService,
  ) {}

  getAssignedQuestions(roleId: string): Promise<QuestionRole[]> {
    return this.questionRoleRepository.find({
      where: { roleId, isActive: true },
      order: { createdAt: "ASC" },
    });
  }

  async getAvailableQuestions(
    roleId: string,
    search?: string,
    categoryId?: string,
  ): Promise<Question[]> {
    const assigned = await this.questionRoleRepository.find({
      where: { roleId, isActive: true },
      select: ["questionId"],
    });
    const assignedIds = assigned.map((r) => r.questionId);

    const qb = this.questionRepository
      .createQueryBuilder("q")
      .leftJoinAndSelect("q.category", "category")
      .where("q.isActive = :isActive", { isActive: true });

    if (assignedIds.length > 0) {
      qb.andWhere("q.id NOT IN (:...assignedIds)", { assignedIds });
    }

    if (search?.trim()) {
      qb.andWhere("q.text ILIKE :search", {
        search: `%${search.trim()}%`,
      });
    }

    if (categoryId) {
      qb.andWhere("q.categoryId = :categoryId", { categoryId });
    }

    return qb.orderBy("q.text", "ASC").getMany();
  }

  getRoles(): Promise<Role[]> {
    return this.roleRepository.find({ order: { name: "ASC" } });
  }

  getQuestionCategories(): Promise<QuestionCategory[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }

  private toUuid(value: string): string | null {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
      ? value
      : null;
  }

  async assignQuestionsToRole(
    input: AssignQuestionsToRoleInput,
    actorId: string,
  ): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { id: input.roleId },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    const foundQuestions = await this.questionRepository.findByIds(
      input.questionIds,
    );
    if (foundQuestions.length !== input.questionIds.length) {
      throw new NotFoundException("One or more questions not found");
    }

    await this.questionRoleRepository
      .createQueryBuilder()
      .insert()
      .into(QuestionRole)
      .values(
        input.questionIds.map((questionId) => ({
          questionId,
          roleId: input.roleId,
          isActive: true,
          createdBy: this.toUuid(actorId),
          updatedBy: this.toUuid(actorId),
        })),
      )
      .orIgnore()
      .execute();

    await this.auditService.log(
      AuditAction.ASSIGN_QUESTIONS_TO_ROLE,
      actorId,
      { roleId: input.roleId, questionIds: input.questionIds },
    );

    return true;
  }

  async removeQuestionFromRole(
    input: RemoveQuestionFromRoleInput,
    actorId: string,
  ): Promise<boolean> {
    const record = await this.questionRoleRepository.findOne({
      where: { roleId: input.roleId, questionId: input.questionId },
    });
    if (!record) {
      throw new NotFoundException("Question role assignment not found");
    }

    await this.questionRoleRepository.remove(record);

    await this.auditService.log(
      AuditAction.REMOVE_QUESTION_FROM_ROLE,
      actorId,
      { roleId: input.roleId, questionId: input.questionId },
    );

    return true;
  }
}
