import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UpdateProjectMemberStatusInput {
  @Field()
  @IsDbUuid()
  projectId: string;

  @Field()
  @IsDbUuid()
  userId: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDbUuid()
  roleId?: string | null;
}
