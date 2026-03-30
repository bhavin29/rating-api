import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Rating } from '../../database/entities';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { SubmitRatingInput } from '../dto/submit-rating.input';
import { SprintRatingOutput } from '../dto/sprint-rating.output';
import { RatingsService } from '../services/ratings.service';

@Resolver()
export class RatingsResolver {
  constructor(private readonly ratingsService: RatingsService) {}

  @Mutation(() => Boolean)
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions('rating:request')
  requestRating(@Args('sprintId') sprintId: string): Promise<boolean> {
    return this.ratingsService.requestRating(sprintId);
  }

  @Mutation(() => Rating)
  submitRating(@Args('input') input: SubmitRatingInput): Promise<Rating> {
    return this.ratingsService.submitRating(input);
  }

  @Query(() => [SprintRatingOutput])
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions('rating:read')
  getSprintRatings(@Args('sprintId') sprintId: string): Promise<SprintRatingOutput[]> {
    return this.ratingsService.getSprintRatings(sprintId);
  }
}
