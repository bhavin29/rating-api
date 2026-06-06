import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@ArgsType()
export class SprintRatingSummaryArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  projectId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  sprintId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  categoryId?: string;
}
