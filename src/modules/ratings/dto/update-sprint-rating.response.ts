import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UpdateSprintRatingResponse {
  @Field()
  status: string;

  @Field()
  message: string;
}
