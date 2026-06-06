import { UseGuards } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { SprintRatingSummaryArgs } from '../dto/sprint-rating-summary.args';
import { SprintRatingSummaryOutput } from '../dto/sprint-rating-summary.output';
import { RatingSummaryService } from '../services/rating-summary.service';

@Resolver()
@UseGuards(UserAuthGuard, RbacGuard)
export class RatingSummaryResolver {
  constructor(private readonly ratingSummaryService: RatingSummaryService) {}

  // User's own feedback page — uses auth context user id
  @Query(() => [SprintRatingSummaryOutput])
  @RequirePermissions('rating_summary:read')
  getMySprintRatingSummary(
    @Args() args: SprintRatingSummaryArgs,
    @Context() context: any,
  ): Promise<SprintRatingSummaryOutput[]> {
    return this.ratingSummaryService.getSprintRatingSummary(
      context.req.user.id,
      args.projectId,
      args.sprintId,
      args.categoryId,
    );
  }

  // Admin Rating Report — pass any userId
  @Query(() => [SprintRatingSummaryOutput])
  @RequirePermissions('rating_summary:admin')
  getSprintRatingSummary(
    @Args('userId') userId: string,
    @Args() args: SprintRatingSummaryArgs,
  ): Promise<SprintRatingSummaryOutput[]> {
    return this.ratingSummaryService.getSprintRatingSummary(
      userId,
      args.projectId,
      args.sprintId,
      args.categoryId,
    );
  }
}
