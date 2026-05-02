import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import { AuditAction, EmailStatus, EmailType } from "../../../common/enums";
import {
  AggregatedRating,
  OverallRating,
  ProjectMember,
  Question,
  Rating,
  RatingAnswer,
  RatingRequest,
  Sprint,
  User,
} from "../../database/entities";
import { AuditService } from "../../audit/services/audit.service";
import { AuthService } from "../../auth/services/auth.service";
import { EmailService } from "../../email/services/email.service";
import { SubmitRatingInput } from "../dto/submit-rating.input";
import { SprintRatingOutput } from "../dto/sprint-rating.output";

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(RatingAnswer)
    private readonly answerRepository: Repository<RatingAnswer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(RatingRequest)
    private readonly ratingRequestRepository: Repository<RatingRequest>,
    @InjectRepository(AggregatedRating)
    private readonly aggregatedRepository: Repository<AggregatedRating>,
    @InjectRepository(OverallRating)
    private readonly overallRepository: Repository<OverallRating>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async requestRating(sprintId: string): Promise<boolean> {
    const projectId = await this.getSprintProjectId(sprintId);
    const members = await this.projectMemberRepository.find({
      where: { projectId, isActive: true },
      relations: { user: true },
    });

    for (const member of members) {
      const token = await this.authService.generateMagicToken(
        member.userId,
        24 * 60,
      );
      const email = await this.emailService.logEmail(
        member.user.email,
        EmailType.INVITE,
        EmailStatus.SENT,
      );
      await this.ratingRequestRepository.save(
        this.ratingRequestRepository.create({
          sprintId,
          ratedUserId: member.userId,
          emailId: email.id,
        }),
      );
      // token persisted and intended for secure link delivery.
      void token;
    }

    return true;
  }

  async submitRating(input: SubmitRatingInput): Promise<Rating> {
    const tokenStatus = await this.authService.validateToken(input.token);
    if (!tokenStatus.valid) {
      throw new BadRequestException(`Token invalid: ${tokenStatus.reason}`);
    }

    const ratedUser = await this.userRepository.findOne({
      where: { id: input.ratedUserId },
    });
    if (!ratedUser) throw new BadRequestException("Rated user does not exist");

    const questions = await this.questionRepository.findBy({
      id: In(input.answers.map((answer) => answer.questionId)),
    });
    if (questions.length !== input.answers.length)
      throw new BadRequestException("Invalid question IDs");

    const expectedRole = ratedUser.roleId;
    const invalidQuestion = questions.find(
      (question) => question.roleId !== expectedRole,
    );
    if (invalidQuestion)
      throw new BadRequestException("Questions must match rated user role");

    const scores = input.answers.map((answer) => answer.score);
    const averageScore = Number(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(
        2,
      ),
    );

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Rating, {
        where: {
          sprintId: input.sprintId,
          raterId: input.raterId,
          ratedUserId: input.ratedUserId,
        },
      });
      if (existing) throw new BadRequestException("Rating already submitted");

      await this.authService.consumeToken(input.token);

      const rating = await manager.save(
        Rating,
        manager.create(Rating, {
          sprintId: input.sprintId,
          raterId: input.raterId,
          ratedUserId: input.ratedUserId,
          averageScore,
        }),
      );

      await manager.save(
        RatingAnswer,
        input.answers.map((answer) =>
          manager.create(RatingAnswer, {
            ratingId: rating.id,
            questionId: answer.questionId,
            score: answer.score,
          }),
        ),
      );

      await this.recomputeAggregates(
        manager,
        input.sprintId,
        input.ratedUserId,
      );
      await this.auditService.log(AuditAction.SUBMIT_RATING, input.raterId, {
        sprintId: input.sprintId,
        ratedUserId: input.ratedUserId,
        ratingId: rating.id,
      });

      return manager.findOneOrFail(Rating, {
        where: { id: rating.id },
        relations: { answers: true },
      });
    });
  }

  async getSprintRatings(sprintId: string): Promise<SprintRatingOutput[]> {
    const rows = await this.ratingRepository
      .createQueryBuilder("rating")
      .innerJoin("rating.ratedUser", "ratedUser")
      .select("rating.ratedUserId", "userId")
      .addSelect("ratedUser.fullName", "userName")
      .addSelect("ROUND(AVG(rating.averageScore)::numeric, 2)", "averageScore")
      .where("rating.sprintId = :sprintId", { sprintId })
      .groupBy("rating.ratedUserId")
      .addGroupBy("ratedUser.fullName")
      .getRawMany<SprintRatingOutput>();

    return rows.map((row) => ({
      ...row,
      averageScore: Number(row.averageScore),
    }));
  }

  private async recomputeAggregates(
    manager: EntityManager,
    sprintId: string,
    userId: string,
  ): Promise<void> {
    const sprintAvg = await manager
      .createQueryBuilder(Rating, "rating")
      .select("AVG(rating.averageScore)", "avg")
      .where("rating.sprintId = :sprintId", { sprintId })
      .andWhere("rating.ratedUserId = :userId", { userId })
      .getRawOne<{ avg: string }>();

    const sprintAverage = Number(Number(sprintAvg?.avg ?? 0).toFixed(2));

    const existingAgg = await manager.findOne(AggregatedRating, {
      where: { sprintId, userId },
    });
    if (existingAgg) {
      existingAgg.averageScore = sprintAverage;
      await manager.save(existingAgg);
    } else {
      await manager.save(
        manager.create(AggregatedRating, {
          sprintId,
          userId,
          averageScore: sprintAverage,
        }),
      );
    }

    const overallAvg = await manager
      .createQueryBuilder(AggregatedRating, "aggregated")
      .select("AVG(aggregated.averageScore)", "avg")
      .where("aggregated.userId = :userId", { userId })
      .getRawOne<{ avg: string }>();

    const overallAverage = Number(Number(overallAvg?.avg ?? 0).toFixed(2));
    const overall = await manager.findOne(OverallRating, { where: { userId } });
    if (overall) {
      overall.averageScore = overallAverage;
      await manager.save(overall);
    } else {
      await manager.save(
        manager.create(OverallRating, { userId, averageScore: overallAverage }),
      );
    }
  }

  private async getSprintProjectId(sprintId: string): Promise<string> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprintId },
    });
    if (!sprint) {
      throw new NotFoundException("Sprint not found");
    }

    if (await this.hasColumn("sprints", "project_id")) {
      const rows = await this.dataSource.query(
        `SELECT project_id AS "projectId" FROM sprints WHERE id = $1`,
        [sprintId],
      );
      if (rows[0]?.projectId) {
        return rows[0].projectId as string;
      }
    }

    const auditRows = await this.dataSource.query(
      `
        SELECT metadata->>'projectId' AS "projectId"
        FROM audit_logs
        WHERE action = $1
          AND metadata->>'sprintId' = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [AuditAction.CREATE_SPRINT, sprintId],
    );

    if (auditRows[0]?.projectId) {
      return auditRows[0].projectId as string;
    }

    throw new BadRequestException("Sprint is not associated with a project");
  }

  private async hasColumn(
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const rows = await this.dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName],
    );

    return rows.length > 0;
  }
}
