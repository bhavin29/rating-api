import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Sprint } from "../../database/entities";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { CreateSprintInput } from "../dto/create-sprint.input";
import { UpdateSprintInput } from "../dto/update-sprint.input";
import { SprintsService } from "../services/sprints.service";
import { Context } from "@nestjs/graphql";

@Resolver()
@UseGuards(UserAuthGuard, RbacGuard)
export class SprintsResolver {
  constructor(private readonly sprintsService: SprintsService) {}

  @Query(() => [Sprint])
  @RequirePermissions("sprint:read")
  getSprints(@Args("projectId") projectId: string): Promise<Sprint[]> {
    return this.sprintsService.getSprints(projectId);
  }

  @Mutation(() => Sprint)
  @RequirePermissions("sprint:create")
  createSprint(
    @Args("input") input: CreateSprintInput,
    @Context() context: any,
  ): Promise<Sprint> {
    return this.sprintsService.createSprint(input, context.req.user.id);
  }

  @Mutation(() => Sprint)
  @RequirePermissions("sprint:update")
  updateSprint(
    @Args("input") input: UpdateSprintInput,
    @Context() context: any,
  ): Promise<Sprint> {
    return this.sprintsService.updateSprint(input, context.req.user.id);
  }

  @Mutation(() => Boolean)
  @RequirePermissions("sprint:update")
  assignProjectMembersToSprint(
    @Args("sprintId") sprintId: string,
    @Context() context: any,
  ): Promise<boolean> {
    return this.sprintsService.assignProjectMembersToSprint(
      sprintId,
      context.req.user.id,
    );
  }

  @Mutation(() => Boolean)
  @RequirePermissions("sprint:update")
  generatePeerRatings(
    @Args("sprintId") sprintId: string,
    @Context() context: any,
  ): Promise<boolean> {
    return this.sprintsService.generatePeerRatings(
      sprintId,
      context.req.user.id,
    );
  }
}
