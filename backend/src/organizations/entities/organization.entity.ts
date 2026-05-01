import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CarbonLog } from '../../carbon-logs/entities/carbon-log.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('increment', { name: 'org_id' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  tax_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_type: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  number_of_employees: number;

  @Column({ type: 'float', default: 0 })
  total_floor_area: number;

  @Column({ type: 'int', default: 0 })
  working_hours_per_year: number;

  @Column({ type: 'int', nullable: true })
  base_year: number;

  @Column({ type: 'float', default: 0 })
  target_reduction_percent: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  current_green_status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => CarbonLog, (log) => log.organization)
  carbon_logs: CarbonLog[];

  @OneToMany(() => Assessment, (req) => req.organization)
  assessments: Assessment[];
}
