import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';
import { RatingAnswer } from './rating-answer.entity';

@ObjectType()
@Index('idx_questions_role_id', ['roleId'])
@Index('idx_questions_is_active', ['isActive'])
@Entity('questions')
export class Question {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'text', name: 'text' })
  text: string;

  @ManyToOne(() => Role, (role) => role.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Field()
  @Column({ name: 'role_id' })
  roleId: string;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => RatingAnswer, (answer) => answer.question)
  answers: RatingAnswer[];
}
