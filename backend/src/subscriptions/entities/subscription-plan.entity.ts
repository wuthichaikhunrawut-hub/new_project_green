import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable, Index } from 'typeorm';
import { Feature } from './feature.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('increment', { name: 'plan_id' })
  id: number;

  @Column({ name: 'plan_name', type: 'varchar', length: 100 })
  plan_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @Column({ type: 'double precision', nullable: true })
  price_per_month: number;

  @Column({ type: 'int', nullable: true })
  max_users: number;

  @Column({ type: 'int', nullable: true })
  max_locations: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToMany(() => Feature)
  @JoinTable({
    name: 'plan_features',
    joinColumn: { name: 'plan_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'feature_id', referencedColumnName: 'id' }
  })
  features: Feature[];

  @Index()
  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
