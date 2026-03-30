import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Sprint, SprintMember } from '../../database/entities';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { AddSprintMembersInput } from '../dto/add-sprint-members.input';
import { CreateSprintInput } from '../dto/create-sprint.input';
import { SprintsService } from '../services/sprints.service';
import { Context } from '@nestjs/graphql';

@Resolver()
@UseGuards(UserAuthGuard, RbacGuard)
export class SprintsResolver {
  constructor(private readonly sprintsService: SprintsService) {}

  @Query(() => [Sprint])
  @RequirePermissions('sprint:read')
  getSprints(@Args('projectId') projectId: string): Promise<Sprint[]> {
    return this.sprintsService.getSprints(projectId);
  }

  @Query(() => [SprintMember])
  @RequirePermissions('sprint:read')
  getSprintMembers(@Args('sprintId') sprintId: string): Promise<SprintMember[]> {
    return this.sprintsService.getSprintMembers(sprintId);
  }

  @Mutation(() => Sprint)
  @RequirePermissions('sprint:create')
  createSprint(@Args('input') input: CreateSprintInput, @Context() context: any): Promise<Sprint> {
    return this.sprintsService.createSprint(input, context.req.user.id);
  }

  @Mutation(() => [SprintMember])
  @RequirePermissions('sprint:update')
  addSprintMembers(@Args('input') input: AddSprintMembersInput): Promise<SprintMember[]> {
    return this.sprintsService.addSprintMembers(input);
  }
}
