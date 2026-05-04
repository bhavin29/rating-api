import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

@InputType()
export class UpdateSprintRatingItemInput {
  @Field(() => String, { name: 'spr_id' })
  @IsDbUuid()
  sprId: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(1)
  @Max(10)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  answer?: string;
}
