import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Question } from '../../database/entities';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateQuestionInput } from '../dto/create-question.input';
import { QuestionsQueryArgs } from '../dto/questions-query.args';
import { ToggleQuestionStatusInput } from '../dto/toggle-question-status.input';
import { UpdateQuestionInput } from '../dto/update-question.input';
import { QuestionsService } from '../services/questions.service';

@Resolver(() => Question)
@UseGuards(UserAuthGuard, RbacGuard)
export class QuestionsResolver {
  constructor(private readonly questionsService: QuestionsService) {}

  @Query(() => [Question])
  @RequirePermissions('question:read')
  getQuestionsByRole(@Args('roleId') roleId: string): Promise<Question[]> {
    return this.questionsService.getQuestionsByRole(roleId);
  }

  @Query(() => [Question])
  @RequirePermissions('question:read')
  questions(@Args() args: QuestionsQueryArgs): Promise<Question[]> {
    return this.questionsService.getQuestions(args);
  }

  @Query(() => Question)
  @RequirePermissions('question:read')
  question(@Args('id') id: string): Promise<Question> {
    return this.questionsService.getQuestionById(id);
  }

  @Mutation(() => Question)
  @RequirePermissions('question:create')
  createQuestion(@Args('input') input: CreateQuestionInput): Promise<Question> {
    return this.questionsService.createQuestion(input);
  }

  @Mutation(() => Question)
  @RequirePermissions('question:update')
  updateQuestion(@Args('input') input: UpdateQuestionInput): Promise<Question> {
    return this.questionsService.updateQuestion(input);
  }

  @Mutation(() => Boolean)
  @RequirePermissions('question:delete')
  deleteQuestion(@Args('id') id: string): Promise<boolean> {
    return this.questionsService.deleteQuestion(id);
  }

  @Mutation(() => Question)
  @RequirePermissions('question:update')
  toggleQuestionStatus(@Args('input') input: ToggleQuestionStatusInput): Promise<Question> {
    return this.questionsService.toggleQuestionStatus(input);
  }
}
