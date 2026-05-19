import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class AdminLoginInput {
  @Field()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;
}
