import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsOptional, Matches } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

const DB_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@InputType()
export class AddProjectMembersInput {
  @Field()
  @IsDbUuid()
  projectId: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @Matches(DB_UUID_REGEX, { each: true, message: 'each value in userIds must be a UUID-like identifier' })
  userIds: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  roleId?: string | null;
}
