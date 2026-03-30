import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Question } from '../../database/entities';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
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
}
