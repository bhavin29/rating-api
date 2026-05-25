import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Project } from './project.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('project_members')
@Unique('uq_project_member_role', ['projectId', 'userId', 'roleId'])
export class ProjectMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.projectMemberships, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Role, { nullable: true })
  @ManyToOne(() => Role, (role) => role.projectMemberships, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role?: Role | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'role_id', nullable: true })
  roleId?: string | null;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => Float)
  @Column({ name: 'allocation_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  allocationPercentage: number;
}
