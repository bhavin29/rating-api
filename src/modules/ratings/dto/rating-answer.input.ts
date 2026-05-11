import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNumber, Max, Min } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class RatingAnswerInput {
  @Field()
  @IsDbUuid()
  questionId: string;

  @Field(() => Float)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(1)
  @Max(7)
  score: number;
}
