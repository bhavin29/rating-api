import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Sprint } from './sprint.entity';
import { User } from './user.entity';
import { RatingAnswer } from './rating-answer.entity';

@ObjectType()
@Entity('ratings')
@Unique('uq_single_rating', ['sprintId', 'raterId', 'ratedUserId'])
export class Rating {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sprint, (sprint) => sprint.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @Column({ name: 'sprint_id' })
  sprintId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.ratingsGiven, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rater_id' })
  rater: User;

  @Column({ name: 'rater_id' })
  raterId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.ratingsReceived, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rated_user_id' })
  ratedUser: User;

  @Column({ name: 'rated_user_id' })
  ratedUserId: string;

  @Field(() => Float)
  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'average_score' })
  averageScore: number;

  @OneToMany(() => RatingAnswer, (answer) => answer.rating, { cascade: true })
  answers: RatingAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
