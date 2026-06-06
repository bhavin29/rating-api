import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Question, QuestionCategory, QuestionRole, Role } from "../../database/entities";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { AssignQuestionsToRoleInput } from "../dto/assign-questions-to-role.input";
import { RemoveQuestionFromRoleInput } from "../dto/remove-question-from-role.input";
import { QuestionRolesService } from "../services/question-roles.service";

@Resolver()
@UseGuards(UserAuthGuard, RbacGuard)
export class QuestionRolesResolver {
  constructor(private readonly questionRolesService: QuestionRolesService) {}

  @Query(() => [QuestionRole])
  @RequirePermissions("question_role:read")
  getAssignedQuestions(
    @Args("roleId") roleId: string,
  ): Promise<QuestionRole[]> {
    return this.questionRolesService.getAssignedQuestions(roleId);
  }

  @Query(() => [Question])
  @RequirePermissions("question_role:read")
  getAvailableQuestions(
    @Args("roleId") roleId: string,
    @Args("search", { nullable: true }) search?: string,
    @Args("categoryId", { nullable: true }) categoryId?: string,
  ): Promise<Question[]> {
    return this.questionRolesService.getAvailableQuestions(
      roleId,
      search,
      categoryId,
    );
  }

  @Query(() => [Role])
  @RequirePermissions("question_role:read")
  getRolesForQuestionAssignment(): Promise<Role[]> {
    return this.questionRolesService.getRoles();
  }

  @Query(() => [QuestionCategory])
  @RequirePermissions("question_role:read")
  getQuestionCategoriesForAssignment(): Promise<QuestionCategory[]> {
    return this.questionRolesService.getQuestionCategories();
  }

  @Mutation(() => Boolean)
  @RequirePermissions("question_role:create")
  assignQuestionsToRole(
    @Args("input") input: AssignQuestionsToRoleInput,
    @Context() context: any,
  ): Promise<boolean> {
    return this.questionRolesService.assignQuestionsToRole(
      input,
      context.req.user.id,
    );
  }

  @Mutation(() => Boolean)
  @RequirePermissions("question_role:delete")
  removeQuestionFromRole(
    @Args("input") input: RemoveQuestionFromRoleInput,
    @Context() context: any,
  ): Promise<boolean> {
    return this.questionRolesService.removeQuestionFromRole(
      input,
      context.req.user.id,
    );
  }
}
