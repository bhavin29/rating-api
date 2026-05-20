import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Rating } from "../../database/entities";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { SprintAuthGuard } from "../../../common/guards/sprint-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { SubmitRatingInput } from "../dto/submit-rating.input";
import { UpdateSprintRatingItemInput } from "../dto/update-sprint-rating.input";
import { UpdateSprintRatingResponse } from "../dto/update-sprint-rating.response";
import { SprintRatingOutput } from "../dto/sprint-rating.output";
import { SprintRatingRequestOutput } from "../dto/sprint-rating-request.output";
import { GenerateSprintRatingRequestArgs } from "../dto/generate-sprint-rating-request.input";
import { RatingsService } from "../services/ratings.service";

@Resolver()
export class RatingsResolver {
  constructor(private readonly ratingsService: RatingsService) {}

  @Mutation(() => Boolean)
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions("rating:request")
  requestRating(
    @Args("sprintId") sprintId: string,
    @Context() context: any,
  ): Promise<boolean> {
    return this.ratingsService.requestRating(sprintId, context.req.user.id);
  }

  @Mutation(() => Rating)
  @UseGuards(SprintAuthGuard)
  submitRating(@Args("input") input: SubmitRatingInput): Promise<Rating> {
    return this.ratingsService.submitRating(input);
  }

  @Mutation(() => UpdateSprintRatingResponse)
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions("rating:update")
  updateSprintRatingRequests(
    @Args({ name: "input", type: () => [UpdateSprintRatingItemInput] })
    input: UpdateSprintRatingItemInput[],
    @Context() context: any,
  ): Promise<UpdateSprintRatingResponse> {
    return this.ratingsService.updateSprintRatingRequests(
      input,
      context.req.user.id,
    );
  }

  @Query(() => [SprintRatingOutput])
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions("rating:read")
  getSprintRatings(
    @Args("sprintId") sprintId: string,
  ): Promise<SprintRatingOutput[]> {
    return this.ratingsService.getSprintRatings(sprintId);
  }

  @Query(() => SprintRatingRequestOutput, { nullable: true })
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions("rating:read")
  generateSprintRatingRequest(
    @Args() args: GenerateSprintRatingRequestArgs,
  ): Promise<SprintRatingRequestOutput | null> {
    return this.ratingsService.generateSprintRatingRequest(args.spmId);
  }
}
