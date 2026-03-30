import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class ValidateTokenInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
}
