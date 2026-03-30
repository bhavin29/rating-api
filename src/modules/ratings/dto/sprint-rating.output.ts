import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SprintRatingOutput {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field(() => Float)
  averageScore: number;
}
