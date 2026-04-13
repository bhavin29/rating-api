import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class CreateSprintInput {
  @Field()
  @IsDbUuid()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @Field()
  @IsDateString()
  startDate: string;

  @Field()
  @IsDateString()
  endDate: string;
}
