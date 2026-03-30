import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';
import { SprintMember } from './sprint-member.entity';
import { Rating } from './rating.entity';
import { AggregatedRating } from './aggregated-rating.entity';

@ObjectType()
@Entity('sprints')
export class Sprint {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'date', name: 'start_date' })
  startDate: string;

  @Field()
  @Column({ type: 'date', name: 'end_date' })
  endDate: string;

  @ManyToOne(() => Project, (project) => project.sprints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'project_id' })
  projectId: string;

  @OneToMany(() => SprintMember, (member) => member.sprint)
  members: SprintMember[];

  @OneToMany(() => Rating, (rating) => rating.sprint)
  ratings: Rating[];

  @OneToMany(() => AggregatedRating, (rating) => rating.sprint)
  aggregatedRatings: AggregatedRating[];
}
