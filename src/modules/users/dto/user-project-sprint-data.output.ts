import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserProjectSprintData {
  @Field(() => ID)
  userId: string;

  @Field()
  userName: string;

  @Field(() => ID)
  projectId: string;

  @Field()
  projectName: string;

  @Field(() => ID)
  sprintId: string;

  @Field()
  sprintName: string;

  @Field()
  sprintStartDate: string;

  @Field()
  sprintEndDate: string;

  @Field(() => ID)
  sprintProjectMemberId: string;
}
