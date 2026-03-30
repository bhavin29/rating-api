import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rating } from './rating.entity';
import { Question } from './question.entity';

@ObjectType()
@Entity('rating_answers')
export class RatingAnswer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Rating, (rating) => rating.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rating_id' })
  rating: Rating;

  @Column({ name: 'rating_id' })
  ratingId: string;

  @Field(() => Question)
  @ManyToOne(() => Question, (question) => question.answers, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'question_id' })
  questionId: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  score: number;
}
