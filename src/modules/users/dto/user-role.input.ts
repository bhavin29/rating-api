import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { MemberLevel } from '../../../common/member-level.enum';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UserRoleInput {
  @Field()
  @IsDbUuid()
  roleId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  skillId?: string;

  @Field(() => MemberLevel, { nullable: true })
  @IsOptional()
  @IsEnum(MemberLevel)
  level?: MemberLevel;
}
