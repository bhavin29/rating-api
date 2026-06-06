import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { UpdateSprintRatingItemInput } from "../dto/update-sprint-rating.input";
import { UpdateSprintRatingResponse } from "../dto/update-sprint-rating.response";
import { SprintRatingRequestOutput } from "../dto/sprint-rating-request.output";
import { GenerateSprintRatingRequestArgs } from "../dto/generate-sprint-rating-request.input";
import { RatingsService } from "../services/ratings.service";

@Resolver()
export class RatingsResolver {
  constructor(private readonly ratingsService: RatingsService) {}

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

  @Mutation(() => Boolean)
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions("rating:update")
  submitSprintRating(
    @Args("spmId") spmId: string,
    @Context() context: any,
  ): Promise<boolean> {
    return this.ratingsService.submitSprintRating(spmId, context.req.user.id);
  }

  @Query(() => SprintRatingRequestOutput, { nullable: true })
  @UseGuards(UserAuthGuard, RbacGuard)
  @RequirePermissions("rating:read")
  generateSprintRatingRequest(
    @Args() args: GenerateSprintRatingRequestArgs,
    @Context() context: any,
  ): Promise<SprintRatingRequestOutput | null> {
    const user = context.req.user;
    const isAdmin = (user?.role?.permissions ?? []).includes('*');
    return this.ratingsService.generateSprintRatingRequest(args.spmId, user.id, isAdmin);
  }
}
