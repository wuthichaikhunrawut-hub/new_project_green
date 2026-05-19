import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('feature_usage_logs')
export class FeatureUsageLog {
  @PrimaryGeneratedColumn('increment', { name: 'feature_usage_log_id' })
  id: number;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  feature_code: string;

  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  usage_date: Date;

  @Column({ type: 'int', nullable: true })
  usage_month: number;

  @Column({ type: 'int', nullable: true })
  usage_year: number;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
