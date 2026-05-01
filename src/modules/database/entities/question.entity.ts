import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';
import { Role } from './role.entity';
import { Sprint } from './sprint.entity';
import { RatingAnswer } from './rating-answer.entity';

@ObjectType()
@Index('idx_questions_role_id', ['roleId'])
@Index('idx_questions_project_id', ['projectId'])
@Index('idx_questions_sprint_id', ['sprintId'])
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

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, (project) => project.questions, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project?: Project | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'project_id', nullable: true })
  projectId?: string | null;

  @Field(() => Sprint, { nullable: true })
  @ManyToOne(() => Sprint, (sprint) => sprint.questions, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sprint_id' })
  sprint?: Sprint | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'sprint_id', nullable: true })
  sprintId?: string | null;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => RatingAnswer, (answer) => answer.question)
  answers: RatingAnswer[];
}
