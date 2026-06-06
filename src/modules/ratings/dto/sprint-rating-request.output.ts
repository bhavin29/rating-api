import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SprintRatingStatus } from '../../../common/enums';

registerEnumType(SprintRatingStatus, { name: 'SprintRatingStatus' });

@ObjectType()
export class RatingQuestion {
  @Field()
  id: string;

  @Field()
  sprId: string;

  @Field()
  text: string;

  @Field(() => Int, { nullable: true })
  rating?: number;

  @Field({ nullable: true })
  helperText?: string;

  @Field({ nullable: true })
  answer?: string;

  @Field()
  ratingByUserId: string;

  @Field()
  ratingByUserName: string;

  @Field()
  ratingByUserRole: string;
}

@ObjectType()
export class SprintRatingRequestOutput {
  @Field()
  spmId: string;

  @Field()
  projectName: string;

  @Field()
  sprintName: string;

  @Field()
  ratedUserName: string;

  @Field()
  ratedUserRole: string;

  @Field(() => [RatingQuestion])
  questions: RatingQuestion[];

  @Field(() => SprintRatingStatus)
  status: SprintRatingStatus;
}
