import { Field, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class AssignQuestionsToRoleInput {
  @Field()
  @IsDbUuid()
  roleId: string;

  @Field(() => [String])
  @IsArray()
  @ArrayMinSize(1)
  @IsDbUuid({ each: true })
  questionIds: string[];
}
