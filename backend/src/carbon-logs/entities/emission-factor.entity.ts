import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('emission_factors')
export class EmissionFactor {
  @PrimaryGeneratedColumn('increment', { name: 'emission_factor_id' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', nullable: true })
  scope: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'double precision', nullable: true })
  factor_value: number;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
