import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UpdateSprintRatingItemInput {
  @Field(() => String, { name: 'spr_id' })
  @IsDbUuid()
  sprId: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  answer?: string;
}
