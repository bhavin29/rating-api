import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class UpdateSprintInput {
  @Field()
  @IsUUID()
  sprintId: string;

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
