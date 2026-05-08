import { Entity, PrimaryColumn } from 'typeorm';

@Entity('plan_features')
export class PlanFeature {
  @PrimaryColumn({ name: 'plan_id' })
  plan_id: number;

  @PrimaryColumn({ name: 'feature_id' })
  feature_id: number;
}
