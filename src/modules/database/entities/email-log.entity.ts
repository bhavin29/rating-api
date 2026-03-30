import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EmailStatus, EmailType } from '../../../common/enums';

@ObjectType()
@Entity('email_logs')
export class EmailLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'to_email' })
  toEmail: string;

  @Field(() => String)
  @Column({ type: 'enum', enum: EmailType })
  type: EmailType;

  @Field(() => String)
  @Column({ type: 'enum', enum: EmailStatus })
  status: EmailStatus;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
