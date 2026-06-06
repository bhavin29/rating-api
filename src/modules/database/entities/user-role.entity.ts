import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MemberLevel } from '../../../common/member-level.enum';
import { Role } from './role.entity';
import { Skill } from './skill.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('user_roles')
export class UserRole {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'role_id' })
  roleId: string;

  @Field(() => Role)
  @ManyToOne(() => Role, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'skill_id', nullable: true })
  skillId: string | null;

  @Field(() => Skill, { nullable: true })
  @ManyToOne(() => Skill, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill | null;

  @Field(() => MemberLevel, { nullable: true })
  @Column({ type: 'varchar', length: 3, nullable: true })
  level: string | null;
}
