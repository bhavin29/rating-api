import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateRoleInput {
  @Field()
  @IsString()
  @MaxLength(150)
  name: string;
}
