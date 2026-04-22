import { Field, InputType } from '@nestjs/graphql';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class DeleteUserInput {
  @Field()
  @IsDbUuid()
  userId: string;
}
