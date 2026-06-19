import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('organization_goals')
export class OrganizationGoal {
  @PrimaryGeneratedColumn('increment', { name: 'goal_id' })
  id: number;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @ManyToOne(() => Organization, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'double precision', nullable: true })
  target_reduction_percent: number;

  @Column({ type: 'timestamp without time zone', nullable: true })
  target_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string;

  @Column({ type: 'double precision', default: 0 })
  progress: number;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
