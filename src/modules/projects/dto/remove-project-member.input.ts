import { Field, InputType } from '@nestjs/graphql';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class RemoveProjectMemberInput {
  @Field()
  @IsDbUuid()
  projectId: string;

  @Field()
  @IsDbUuid()
  userId: string;
}
