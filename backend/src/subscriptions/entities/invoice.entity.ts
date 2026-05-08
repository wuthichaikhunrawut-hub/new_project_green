import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('increment', { name: 'invoice_id' })
  id: number;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'plan_id', nullable: true })
  plan_id: number;

  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ type: 'double precision', nullable: true })
  amount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string; // PENDING | PAID | CANCELLED

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
