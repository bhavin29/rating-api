import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Project, ProjectMember } from "../../database/entities";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { AddProjectMembersInput } from "../dto/add-project-members.input";
import { CreateProjectInput } from "../dto/create-project.input";
import { RemoveProjectMemberInput } from "../dto/remove-project-member.input";
import { UpdateProjectMemberStatusInput } from "../dto/update-project-member-status.input";
import { UpdateProjectInput } from "../dto/update-project.input";
import { ProjectsService } from "../services/projects.service";

@Resolver(() => Project)
@UseGuards(UserAuthGuard, RbacGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Query(() => [Project])
  @RequirePermissions("project:read")
  getProjects(): Promise<Project[]> {
    return this.projectsService.getProjects();
  }

  @Query(() => [ProjectMember])
  @RequirePermissions("project:read")
  getProjectMembers(
    @Args("projectId") projectId: string,
  ): Promise<ProjectMember[]> {
    return this.projectsService.getProjectMembers(projectId);
  }

  @Mutation(() => Project)
  @RequirePermissions("project:create")
  createProject(
    @Args("input") input: CreateProjectInput,
    @Context() context: any,
  ): Promise<Project> {
    return this.projectsService.createProject(input, context.req.user.id);
  }

  @Mutation(() => Project)
  @RequirePermissions("project:update")
  updateProject(
    @Args("input") input: UpdateProjectInput,
    @Context() context: any,
  ): Promise<Project> {
    return this.projectsService.updateProject(input, context.req.user.id);
  }

  @Mutation(() => [ProjectMember])
  @RequirePermissions("project:update")
  addProjectMembers(
    @Args("input") input: AddProjectMembersInput,
    @Context() context: any,
  ): Promise<ProjectMember[]> {
    return this.projectsService.addProjectMembers(input, context.req.user.id);
  }

  @Mutation(() => ProjectMember)
  @RequirePermissions("project:update")
  updateProjectMemberStatus(
    @Args("input") input: UpdateProjectMemberStatusInput,
    @Context() context: any,
  ): Promise<ProjectMember> {
    return this.projectsService.updateProjectMemberStatus(
      input,
      context.req.user.id,
    );
  }

  @Mutation(() => Boolean)
  @RequirePermissions("project:update")
  removeProjectMember(
    @Args("input") input: RemoveProjectMemberInput,
    @Context() context: any,
  ): Promise<boolean> {
    return this.projectsService.removeProjectMember(input, context.req.user.id);
  }
}
