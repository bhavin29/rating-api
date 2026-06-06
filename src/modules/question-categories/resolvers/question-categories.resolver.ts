import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { QuestionCategory } from "../../database/entities";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { CreateQuestionCategoryInput } from "../dto/create-question-category.input";
import { QuestionCategoriesQueryArgs } from "../dto/question-categories-query.args";
import { ToggleQuestionCategoryStatusInput } from "../dto/toggle-question-category-status.input";
import { UpdateQuestionCategoryInput } from "../dto/update-question-category.input";
import { QuestionCategoriesService } from "../services/question-categories.service";

@Resolver(() => QuestionCategory)
@UseGuards(UserAuthGuard, RbacGuard)
export class QuestionCategoriesResolver {
  constructor(
    private readonly questionCategoriesService: QuestionCategoriesService,
  ) {}

  @Query(() => [QuestionCategory])
  @RequirePermissions("question_category:read")
  questionCategories(
    @Args() args: QuestionCategoriesQueryArgs,
  ): Promise<QuestionCategory[]> {
    return this.questionCategoriesService.getQuestionCategories(args);
  }

  @Query(() => QuestionCategory)
  @RequirePermissions("question_category:read")
  questionCategory(@Args("id") id: string): Promise<QuestionCategory> {
    return this.questionCategoriesService.getQuestionCategoryById(id);
  }

  @Mutation(() => QuestionCategory)
  @RequirePermissions("question_category:create")
  createQuestionCategory(
    @Args("input") input: CreateQuestionCategoryInput,
    @Context() context: any,
  ): Promise<QuestionCategory> {
    return this.questionCategoriesService.createQuestionCategory(
      input,
      context.req.user.id,
    );
  }

  @Mutation(() => QuestionCategory)
  @RequirePermissions("question_category:update")
  updateQuestionCategory(
    @Args("input") input: UpdateQuestionCategoryInput,
    @Context() context: any,
  ): Promise<QuestionCategory> {
    return this.questionCategoriesService.updateQuestionCategory(
      input,
      context.req.user.id,
    );
  }

  @Mutation(() => Boolean)
  @RequirePermissions("question_category:delete")
  deleteQuestionCategory(
    @Args("id") id: string,
    @Context() context: any,
  ): Promise<boolean> {
    return this.questionCategoriesService.deleteQuestionCategory(
      id,
      context.req.user.id,
    );
  }

  @Mutation(() => QuestionCategory)
  @RequirePermissions("question_category:update")
  toggleQuestionCategoryStatus(
    @Args("input") input: ToggleQuestionCategoryStatusInput,
    @Context() context: any,
  ): Promise<QuestionCategory> {
    return this.questionCategoriesService.toggleQuestionCategoryStatus(
      input,
      context.req.user.id,
    );
  }
}
