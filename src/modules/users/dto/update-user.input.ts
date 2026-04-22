import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UpdateUserInput {
  @Field()
  @IsDbUuid()
  userId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  roleId?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}
