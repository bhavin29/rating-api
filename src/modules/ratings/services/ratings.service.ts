import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuditAction, EmailStatus, EmailType } from '../../../common/enums';
import {
  AggregatedRating,
  OverallRating,
  Question,
  Rating,
  RatingAnswer,
  RatingRequest,
  SprintMember,
  User,
} from '../../database/entities';
import { AuditService } from '../../audit/services/audit.service';
import { AuthService } from '../../auth/services/auth.service';
import { EmailService } from '../../email/services/email.service';
import { SubmitRatingInput } from '../dto/submit-rating.input';
import { SprintRatingOutput } from '../dto/sprint-rating.output';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(RatingAnswer) private readonly answerRepository: Repository<RatingAnswer>,
    @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(SprintMember) private readonly sprintMemberRepository: Repository<SprintMember>,
    @InjectRepository(RatingRequest) private readonly ratingRequestRepository: Repository<RatingRequest>,
    @InjectRepository(AggregatedRating) private readonly aggregatedRepository: Repository<AggregatedRating>,
    @InjectRepository(OverallRating) private readonly overallRepository: Repository<OverallRating>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async requestRating(sprintId: string): Promise<boolean> {
    const members = await this.sprintMemberRepository.find({ where: { sprintId }, relations: { user: true } });

    for (const member of members) {
      const token = await this.authService.generateMagicToken(member.userId, 24 * 60);
      const email = await this.emailService.logEmail(member.user.email, EmailType.INVITE, EmailStatus.SENT);
      await this.ratingRequestRepository.save(
        this.ratingRequestRepository.create({ sprintId, ratedUserId: member.userId, emailId: email.id }),
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

    const ratedUser = await this.userRepository.findOne({ where: { id: input.ratedUserId } });
    if (!ratedUser) throw new BadRequestException('Rated user does not exist');

    const questions = await this.questionRepository.findBy({ id: input.answers.map((answer) => answer.questionId) });
    if (questions.length !== input.answers.length) throw new BadRequestException('Invalid question IDs');

    const expectedRole = ratedUser.roleId;
    const invalidQuestion = questions.find((question) => question.roleId !== expectedRole);
    if (invalidQuestion) throw new BadRequestException('Questions must match rated user role');

    const scores = input.answers.map((answer) => answer.score);
    const averageScore = Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Rating, {
        where: { sprintId: input.sprintId, raterId: input.raterId, ratedUserId: input.ratedUserId },
      });
      if (existing) throw new BadRequestException('Rating already submitted');

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

      await this.recomputeAggregates(manager, input.sprintId, input.ratedUserId);
      await this.auditService.log(AuditAction.SUBMIT_RATING, input.raterId, {
        sprintId: input.sprintId,
        ratedUserId: input.ratedUserId,
        ratingId: rating.id,
      });

      return manager.findOneOrFail(Rating, { where: { id: rating.id }, relations: { answers: true } });
    });
  }

  async getSprintRatings(sprintId: string): Promise<SprintRatingOutput[]> {
    const rows = await this.ratingRepository
      .createQueryBuilder('rating')
      .innerJoin('rating.ratedUser', 'ratedUser')
      .select('rating.ratedUserId', 'userId')
      .addSelect('ratedUser.fullName', 'userName')
      .addSelect('ROUND(AVG(rating.averageScore)::numeric, 2)', 'averageScore')
      .where('rating.sprintId = :sprintId', { sprintId })
      .groupBy('rating.ratedUserId')
      .addGroupBy('ratedUser.fullName')
      .getRawMany<SprintRatingOutput>();

    return rows.map((row) => ({ ...row, averageScore: Number(row.averageScore) }));
  }

  private async recomputeAggregates(manager: EntityManager, sprintId: string, userId: string): Promise<void> {
    const sprintAvg = await manager
      .createQueryBuilder(Rating, 'rating')
      .select('AVG(rating.averageScore)', 'avg')
      .where('rating.sprintId = :sprintId', { sprintId })
      .andWhere('rating.ratedUserId = :userId', { userId })
      .getRawOne<{ avg: string }>();

    const sprintAverage = Number(Number(sprintAvg?.avg ?? 0).toFixed(2));

    const existingAgg = await manager.findOne(AggregatedRating, { where: { sprintId, userId } });
    if (existingAgg) {
      existingAgg.averageScore = sprintAverage;
      await manager.save(existingAgg);
    } else {
      await manager.save(manager.create(AggregatedRating, { sprintId, userId, averageScore: sprintAverage }));
    }

    const overallAvg = await manager
      .createQueryBuilder(AggregatedRating, 'aggregated')
      .select('AVG(aggregated.averageScore)', 'avg')
      .where('aggregated.userId = :userId', { userId })
      .getRawOne<{ avg: string }>();

    const overallAverage = Number(Number(overallAvg?.avg ?? 0).toFixed(2));
    const overall = await manager.findOne(OverallRating, { where: { userId } });
    if (overall) {
      overall.averageScore = overallAverage;
      await manager.save(overall);
    } else {
      await manager.save(manager.create(OverallRating, { userId, averageScore: overallAverage }));
    }
  }
}
