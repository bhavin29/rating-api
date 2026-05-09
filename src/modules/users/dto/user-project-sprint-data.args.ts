import { ArgsType, Field } from '@nestjs/graphql';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@ArgsType()
export class UserProjectSprintDataArgs {
  @Field()
  @IsDbUuid()
  userId: string;
}
