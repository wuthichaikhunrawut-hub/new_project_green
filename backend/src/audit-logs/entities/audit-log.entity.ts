import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('assessment_audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { name: 'audit_log_id' })
  id: number;

  @Column({ name: 'assessment_detail_id', nullable: true })
  assessment_detail_id: number;

  @Column({ name: 'action_by_user_id', nullable: true })
  action_by_user_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'action_by_user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
