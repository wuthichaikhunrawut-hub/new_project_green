import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('increment', { name: 'plan_id' })
  id: number;

  @Column({ name: 'plan_name', type: 'varchar', length: 100 })
  plan_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'double precision', nullable: true })
  price_per_month: number;

  @Column({ type: 'int', nullable: true })
  max_users: number;

  @Column({ type: 'int', nullable: true })
  max_locations: number;

  @Column({ type: 'boolean', default: false })
  has_ai_scan: boolean;

  @Column({ type: 'boolean', default: true })
  has_green_office: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
