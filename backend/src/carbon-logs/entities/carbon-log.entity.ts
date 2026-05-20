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
import { OrganizationUnit } from '../../organizations/entities/organization-unit.entity';
import { EmissionFactor } from './emission-factor.entity';

@Entity('carbon_activity_logs')
export class CarbonLog {
  @PrimaryGeneratedColumn('increment', { name: 'carbon_log_id' })
  id: number;

  @Column({ name: 'emission_factor_id', nullable: true })
  emission_factor_id: number;

  @ManyToOne(() => EmissionFactor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'emission_factor_id' })
  emission_factor: EmissionFactor;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @ManyToOne(() => Organization, (org) => org.carbon_logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'org_unit_id', nullable: true })
  org_unit_id: number;

  @ManyToOne(() => OrganizationUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'org_unit_id' })
  organization_unit: OrganizationUnit;

  @Column({ type: 'varchar', length: 100, nullable: true })
  activity_type: string;

  @Column({ type: 'int', nullable: true })
  month: number;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'double precision', nullable: true })
  usage_amount: number;

  @Column({ type: 'double precision', nullable: true })
  total_emission: number;

  @Column({ type: 'text', nullable: true })
  evidence_url: string;

  @Column({ type: 'character varying', length: 100, nullable: true })
  data_source: string;

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
