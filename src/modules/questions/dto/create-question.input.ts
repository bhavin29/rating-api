import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class CreateQuestionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;

  @Field()
  @IsDbUuid()
  roleId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDbUuid()
  projectId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDbUuid()
  sprintId?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
