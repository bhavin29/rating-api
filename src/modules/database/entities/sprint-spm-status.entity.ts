import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SprintRatingStatus } from '../../../common/enums';

registerEnumType(SprintRatingStatus, { name: 'SprintRatingStatus' });

@ObjectType()
@Entity('sprint_spm_status')
export class SprintSpmStatus {
  @Field(() => ID)
  @PrimaryColumn({ name: 'spm_id', type: 'uuid' })
  spmId: string;

  @Field(() => SprintRatingStatus)
  @Column({
    type: 'varchar',
    length: 20,
    default: SprintRatingStatus.DRAFT,
  })
  status: SprintRatingStatus;

  @Field(() => String, { nullable: true })
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'submitted_by', type: 'uuid', nullable: true })
  submittedBy: string | null;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
