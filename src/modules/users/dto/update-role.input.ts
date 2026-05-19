import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UpdateRoleInput {
  @Field()
  @IsDbUuid()
  roleId: string;

  @Field()
  @IsString()
  @MaxLength(150)
  name: string;
}
