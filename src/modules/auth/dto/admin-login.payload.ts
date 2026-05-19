import { Field, ObjectType } from '@nestjs/graphql';
import { AdminUser } from '../../database/entities';

@ObjectType()
export class AdminLoginPayload {
  @Field()
  token: string;

  @Field(() => AdminUser)
  adminUser: AdminUser;
}
