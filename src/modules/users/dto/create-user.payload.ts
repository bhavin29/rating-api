import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../database/entities';

@ObjectType('CreateUserPayload')
export class CreateUserPayload {
  @Field(() => User)
  user: User;

  @Field()
  plainPin: string;
}
