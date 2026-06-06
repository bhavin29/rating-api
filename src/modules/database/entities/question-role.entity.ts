import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Role } from './role.entity';

@ObjectType()
@Unique('question_role_question_id_role_id_key', ['questionId', 'roleId'])
@Index('idx_question_role_question_id', ['questionId'])
@Index('idx_question_role_role_id', ['roleId'])
@Entity('question_role')
export class QuestionRole {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Question)
  @ManyToOne(() => Question, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'question_id' })
  questionId: string;

  @Field(() => Role)
  @ManyToOne(() => Role, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: string;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ name: 'created_by', nullable: true, type: 'uuid' })
  createdBy: string | null;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ name: 'updated_by', nullable: true, type: 'uuid' })
  updatedBy: string | null;
}
