import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class RatingAnswerInput {
  @Field()
  @IsDbUuid()
  questionId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(7)
  score: number;
}
