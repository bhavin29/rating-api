import { Field, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RatingAnswerInput } from './rating-answer.input';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class SubmitRatingInput {
  @Field()
  token: string;

  @Field()
  @IsDbUuid()
  sprintId: string;

  @Field()
  @IsDbUuid()
  raterId: string;

  @Field()
  @IsDbUuid()
  ratedUserId: string;

  @Field(() => [RatingAnswerInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RatingAnswerInput)
  answers: RatingAnswerInput[];
}
