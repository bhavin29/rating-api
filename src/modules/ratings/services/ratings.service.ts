import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AuditAction, SprintRatingStatus } from "../../../common/enums";
import { SprintSpmStatus } from "../../database/entities";
import { AuditService } from "../../audit/services/audit.service";
import { UpdateSprintRatingItemInput } from "../dto/update-sprint-rating.input";
import {
  SprintRatingRequestOutput,
  RatingQuestion,
} from "../dto/sprint-rating-request.output";

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(SprintSpmStatus)
    private readonly spmStatusRepository: Repository<SprintSpmStatus>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async updateSprintRatingRequests(
    items: UpdateSprintRatingItemInput[],
    actorId: string,
  ): Promise<{ status: string; message: string }> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("No sprint rating updates provided");
    }

    this.logger.debug(
      `updateSprintRatingRequests received ${items.length} item(s): ${JSON.stringify(items)}`,
    );

    const normalizedItems = items.map((item) => ({
      original: item,
      spr_id: item.sprId || (item as any).spr_id,
      rating: item.rating,
      answer: item.answer,
    }));

    const payload = normalizedItems
      .map((item) => ({
        spr_id: item.spr_id,
        rating: item.rating,
        answer: item.answer,
      }))
      .filter((item) => {
        if (!item.spr_id) return false;
        if (item.rating === undefined) return true;
        return (
          typeof item.rating === "number" &&
          Number.isFinite(item.rating) &&
          item.rating >= 1 &&
          item.rating <= 10
        );
      });

    if (payload.length === 0) {
      this.logger.warn(
        `updateSprintRatingRequests rejected all items; normalized payload=${JSON.stringify(payload)}`,
      );
      throw new BadRequestException(
        "At least one valid sprint rating update item with spr_id is required",
      );
    }

    if (payload.length !== items.length) {
      this.logger.warn(
        `Skipped ${items.length - payload.length} invalid sprint rating item(s)`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT public.update_sprint_rating_request($1::jsonb)`,
        [JSON.stringify(payload)],
      );
    });

    await this.auditService.log(
      AuditAction.UPDATE_SPRINT_RATING_REQUESTS,
      actorId,
      {
        updatedCount: payload.length,
        sprintProjectMemberIds: payload.map((item) => item.spr_id),
      },
    );

    return {
      status: "success",
      message: "Sprint ratings updated successfully",
    };
  }

  async generateSprintRatingRequest(
    spmId: string,
  ): Promise<SprintRatingRequestOutput | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT * FROM public.generate_sprint_rating_request($1)`,
        [spmId],
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      const firstRow = rows[0];

      const questions: RatingQuestion[] = rows.map((row: any) => ({
        id: row.question_id || row.id || "",
        sprId: row.spr_id || "",
        text: row.question_text,
        rating: row.rating ?? row.question_rating ?? undefined,
        helperText: row.helper_text ?? row.helperText ?? undefined,
        answer:
          row.answer ?? row.answer_text ?? row.question_answer ?? undefined,
        ratingByUserId: row.rating_by_user_id || "",
        ratingByUserName: row.rating_by_user_name,
        ratingByUserRole: row.rating_by_user_role,
      }));

      const spmStatus = await this.spmStatusRepository.findOne({
        where: { spmId },
      });

      return {
        spmId,
        projectName: firstRow.project_name,
        sprintName: firstRow.sprint_name,
        ratedUserName: firstRow.rated_user_name,
        ratedUserRole: firstRow.rated_user_role,
        questions,
        status: spmStatus?.status ?? SprintRatingStatus.DRAFT,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to generate sprint rating request: ${error.message}`,
        );
      }
      throw new BadRequestException("Failed to generate sprint rating request");
    }
  }

  async submitSprintRating(spmId: string, actorId: string): Promise<boolean> {
    const existing = await this.spmStatusRepository.findOne({
      where: { spmId },
    });

    if (existing) {
      existing.status = SprintRatingStatus.SUBMITTED;
      existing.submittedAt = new Date();
      existing.submittedBy = this.toUuid(actorId);
      await this.spmStatusRepository.save(existing);
    } else {
      await this.spmStatusRepository.save(
        this.spmStatusRepository.create({
          spmId,
          status: SprintRatingStatus.SUBMITTED,
          submittedAt: new Date(),
          submittedBy: this.toUuid(actorId),
        }),
      );
    }

    await this.auditService.log(AuditAction.SUBMIT_SPRINT_RATING, actorId, {
      spmId,
    });

    return true;
  }

  private toUuid(value: string): string | null {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
      ? value
      : null;
  }
}
