import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Project } from '../../database/entities';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateProjectInput } from '../dto/create-project.input';
import { ProjectsService } from '../services/projects.service';

@Resolver(() => Project)
@UseGuards(UserAuthGuard, RbacGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Query(() => [Project])
  @RequirePermissions('project:read')
  getProjects(): Promise<Project[]> {
    return this.projectsService.getProjects();
  }

  @Mutation(() => Project)
  @RequirePermissions('project:create')
  createProject(@Args('input') input: CreateProjectInput, @Context() context: any): Promise<Project> {
    return this.projectsService.createProject(input, context.req.user.id);
  }
}
