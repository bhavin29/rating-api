import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SecurityPinResult {
  @Field()
  userId: string;

  @Field()
  pin: string;
}
