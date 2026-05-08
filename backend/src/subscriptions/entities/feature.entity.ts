import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('increment', { name: 'feature_id' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  feature_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  feature_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
