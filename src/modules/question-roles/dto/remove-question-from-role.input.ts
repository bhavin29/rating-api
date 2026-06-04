import { Field, InputType } from '@nestjs/graphql';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class RemoveQuestionFromRoleInput {
  @Field()
  @IsDbUuid()
  roleId: string;

  @Field()
  @IsDbUuid()
  questionId: string;
}
