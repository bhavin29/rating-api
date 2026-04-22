import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@ArgsType()
export class QuestionsQueryArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDbUuid()
  roleId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  take?: number = 20;
}
