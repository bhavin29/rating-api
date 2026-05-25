import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';
import { UserRoleInput } from './user-role.input';

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

  @Field(() => [UserRoleInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleInput)
  userRoles?: UserRoleInput[];
}
