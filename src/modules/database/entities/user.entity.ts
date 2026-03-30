import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { ProjectMember } from './project-member.entity';
import { SprintMember } from './sprint-member.entity';
import { Rating } from './rating.entity';
import { AggregatedRating } from './aggregated-rating.entity';
import { OverallRating } from './overall-rating.entity';
import { SecureToken } from './secure-token.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column({ name: 'name' })
  fullName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => Role)
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: string;

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => SprintMember, (member) => member.user)
  sprintMemberships: SprintMember[];

  @OneToMany(() => Rating, (rating) => rating.rater)
  ratingsGiven: Rating[];

  @OneToMany(() => Rating, (rating) => rating.ratedUser)
  ratingsReceived: Rating[];

  @OneToMany(() => AggregatedRating, (rating) => rating.user)
  aggregatedRatings: AggregatedRating[];

  @OneToMany(() => OverallRating, (rating) => rating.user)
  overallRatings: OverallRating[];

  @OneToMany(() => SecureToken, (token) => token.user)
  secureTokens: SecureToken[];
}
