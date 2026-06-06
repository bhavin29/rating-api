import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateSprintInput {
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
