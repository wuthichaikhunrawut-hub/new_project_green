import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chat_logs')
export class ChatLog {
  @PrimaryGeneratedColumn('increment', { name: 'chat_log_id' })
  id: number;

  @Column({ name: 'user_id', nullable: true })
  user_id: number | null;

  @Column({ type: 'text', nullable: true })
  question: string;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  intent: string;

  @Column({ type: 'int', nullable: true, name: 'session_id' })
  session_id: number | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'session_title',
  })
  session_title: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  related_module: string;

  @Column({ type: 'double precision', nullable: true })
  confidence_score: number;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
