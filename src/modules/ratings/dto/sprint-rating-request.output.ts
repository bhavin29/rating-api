import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SprintRatingRequestOutput {
  @Field()
  projectName: string;

  @Field()
  sprintName: string;

  @Field()
  ratedUserName: string;

  @Field()
  ratedUserRole: string;

  @Field()
  ratingByUserName: string;

  @Field()
  ratingByUserRole: string;

  @Field()
  questionText: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  answer?: string;
}
