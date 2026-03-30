import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@ObjectType()
@Entity('overall_ratings')
@Unique('uq_overall_rating', ['userId'])
export class OverallRating {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.overallRatings, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Float)
  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'average_score' })
  averageScore: number;
}
