import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Sprint } from './sprint.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('sprint_members')
@Unique('uq_sprint_member', ['sprintId', 'userId'])
export class SprintMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sprint, (sprint) => sprint.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @Column({ name: 'sprint_id' })
  sprintId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.sprintMemberships, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;
}
