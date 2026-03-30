import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { User } from './user.entity';
import { Question } from './question.entity';

@ObjectType()
@Entity('roles')
export class Role {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @OneToMany(() => RolePermission, (permission) => permission.role)
  permissions: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @OneToMany(() => Question, (question) => question.role)
  questions: Question[];
}
