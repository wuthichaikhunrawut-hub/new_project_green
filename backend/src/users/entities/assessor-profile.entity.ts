import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

export enum VerificationStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected',
}

@Entity('assessor_profiles')
export class AssessorProfile {
  @PrimaryGeneratedColumn({ name: 'assessor_profile_id' })
  id: number;

  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  license_number: string;

  @Column({ type: 'integer', nullable: true })
  years_experience: number;

  @Column({ type: 'text', nullable: true })
  education_background: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualification_file_url: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  verification_status: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  verified_at: Date;

  @Column({ name: 'verified_by', nullable: true })
  verified_by_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verified_by: User;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
