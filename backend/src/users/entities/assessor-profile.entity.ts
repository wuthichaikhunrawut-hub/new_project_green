import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export enum VerificationStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected',
}

@Entity('assessor_profiles')
export class AssessorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.assessor_profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  license_number: string;

  @Column({ type: 'text', nullable: true })
  expertise_tags: string; // Stored as comma-separated or JSON string

  @Column({ type: 'integer', default: 0 })
  years_experience: number;

  @Column({ type: 'text', nullable: true })
  education_background: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualification_file_url: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: VerificationStatus.PENDING,
  })
  verification_status: VerificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verified_by: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bank_account_no: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bank_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
