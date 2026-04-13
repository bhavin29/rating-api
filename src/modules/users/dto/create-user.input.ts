import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @Field()
  @IsDbUuid()
  roleId: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  projectId?: string;
}
