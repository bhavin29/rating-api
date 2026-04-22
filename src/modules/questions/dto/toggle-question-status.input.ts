import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class ToggleQuestionStatusInput {
  @Field()
  @IsDbUuid()
  id: string;

  @Field()
  @IsBoolean()
  isActive: boolean;
}
