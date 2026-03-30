import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Sprint } from './sprint.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('aggregated_ratings')
@Unique('uq_agg_rating', ['sprintId', 'userId'])
export class AggregatedRating {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sprint, (sprint) => sprint.aggregatedRatings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @Column({ name: 'sprint_id' })
  sprintId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.aggregatedRatings, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Float)
  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'average_score' })
  averageScore: number;
}
