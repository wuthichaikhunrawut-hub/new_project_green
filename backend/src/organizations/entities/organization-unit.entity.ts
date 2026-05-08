import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';

@Entity('organization_units')
export class OrganizationUnit {
  @PrimaryGeneratedColumn('increment', { name: 'unit_id' })
  id: number;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @Column({ type: 'varchar', length: 255 })
  unit_name: string;

  @Column({ name: 'parent_unit_id', nullable: true })
  parent_unit_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unit_type: string;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @ManyToOne(() => OrganizationUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_unit_id' })
  parent_unit: OrganizationUnit;
}
