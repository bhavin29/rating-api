import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity('admin_sessions')
export class AdminSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdminUser, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;

  @Column({ name: 'admin_user_id' })
  adminUserId: string;

  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
