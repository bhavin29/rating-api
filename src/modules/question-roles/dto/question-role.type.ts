import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Question } from '../../database/entities/question.entity';
import { Role } from '../../database/entities/role.entity';

@ObjectType()
export class QuestionRoleType {
  @Field(() => ID)
  id: string;

  @Field(() => Question)
  question: Question;

  @Field()
  questionId: string;

  @Field(() => Role)
  role: Role;

  @Field()
  roleId: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field(() => String, { nullable: true })
  createdBy: string | null;

  @Field()
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  updatedBy: string | null;
}
