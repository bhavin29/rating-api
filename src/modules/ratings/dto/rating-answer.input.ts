import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class RatingAnswerInput {
  @Field()
  @IsUUID()
  questionId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(7)
  score: number;
}
