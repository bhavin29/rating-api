import { Field, ArgsType } from '@nestjs/graphql';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@ArgsType()
export class GenerateSprintRatingRequestArgs {
  @Field()
  @IsDbUuid()
  spmId: string;
}
