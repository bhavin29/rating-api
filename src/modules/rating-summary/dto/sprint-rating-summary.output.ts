import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CategoryRatingOutput {
  @Field(() => String, { nullable: true })
  categoryId: string | null;

  @Field(() => String, { nullable: true })
  categoryName: string | null;

  @Field(() => Float)
  averageRating: number;
}

@ObjectType()
export class SprintRatingSummaryOutput {
  @Field()
  sprintId: string;

  @Field()
  sprintName: string;

  @Field()
  projectId: string;

  @Field()
  projectName: string;

  @Field(() => Float)
  overallRating: number;

  @Field(() => [CategoryRatingOutput])
  categories: CategoryRatingOutput[];
}
