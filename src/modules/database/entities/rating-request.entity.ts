import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Sprint } from './sprint.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('rating_requests')
export class RatingRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sprint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @Column({ name: 'sprint_id' })
  sprintId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rated_user_id' })
  ratedUser: User;

  @Column({ name: 'rated_user_id' })
  ratedUserId: string;

  @Column({ name: 'email_id' })
  emailId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
