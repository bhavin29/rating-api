import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TokenValidationPayload {
  @Field()
  valid: boolean;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  reason?: string;
}
