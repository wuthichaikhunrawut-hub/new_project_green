import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assessment } from './assessment.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('increment', { name: 'certificate_id' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  certificate_no: string;

  @Column({ name: 'assessment_id', nullable: true })
  assessment_id: number;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @Column({ type: 'timestamp without time zone', nullable: true })
  issued_at: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  expired_at: Date;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Assessment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: Assessment;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
