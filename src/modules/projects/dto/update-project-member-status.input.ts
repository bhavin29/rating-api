import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UpdateProjectMemberStatusInput {
  @Field()
  @IsDbUuid()
  projectId: string;

  @Field()
  @IsDbUuid()
  userId: string;

  @Field()
  @IsBoolean()
  isActive: boolean;
}
