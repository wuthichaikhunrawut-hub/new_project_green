import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('green_criteria_master')
export class GreenCriteriaMaster {
  @PrimaryGeneratedColumn('increment', { name: 'criteria_id' })
  id: number;

  @Column({ name: 'category_number', type: 'int', nullable: true })
  category_number: number;

  @Column({
    name: 'criteria_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  criteria_code: string;

  @Column({
    name: 'criteria_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  criteria_name: string;

  @Column({ name: 'max_score', type: 'double precision', nullable: true })
  max_score: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'year_version', type: 'int', nullable: true })
  year_version: number;

  @Column({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
