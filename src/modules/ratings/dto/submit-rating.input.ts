import { Field, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RatingAnswerInput } from './rating-answer.input';

@InputType()
export class SubmitRatingInput {
  @Field()
  token: string;

  @Field()
  @IsUUID()
  sprintId: string;

  @Field()
  @IsUUID()
  raterId: string;

  @Field()
  @IsUUID()
  ratedUserId: string;

  @Field(() => [RatingAnswerInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RatingAnswerInput)
  answers: RatingAnswerInput[];
}
