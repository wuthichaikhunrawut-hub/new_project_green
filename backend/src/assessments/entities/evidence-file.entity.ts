import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssessmentDetail } from './assessment-detail.entity';
import { User } from '../../users/entities/user.entity';

@Entity('evidence_files')
export class EvidenceFile {
  @PrimaryGeneratedColumn('increment', { name: 'evidence_file_id' })
  id: number;

  @Column({ name: 'assessment_detail_id', nullable: true })
  assessment_detail_id: number;

  @ManyToOne(() => AssessmentDetail, (detail) => detail.evidence_files, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assessment_detail_id' })
  assessment_detail: AssessmentDetail;

  @Column({ name: 'uploaded_by_user_id', nullable: true })
  uploaded_by_user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploaded_by: User;

  @Column({ name: 'carbon_log_id', nullable: true })
  carbon_log_id: number;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  file_name: string;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  file_url: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true })
  file_type: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  file_size: number;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category: string;

  @CreateDateColumn({
    name: 'uploaded_at',
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  uploaded_at: Date;
}
