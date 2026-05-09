import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne, ManyToMany, JoinTable } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Assessment } from '../../assessments/entities/assessment.entity';
import { AssessorProfile } from './assessor-profile.entity';
import { UserProfile } from './user-profile.entity';
import { Role } from './role.entity';

export enum UserRole {
  SYSTEM_ADMIN = 'System Admin',
  ORG_ADMIN = 'Organization Admin',
  EXECUTIVE = 'Executive',
  EMPLOYEE = 'Employee',
  ASSESSOR = 'Assessor',
  USER = 'User',
  ADMIN = 'ADMIN', // legacy alias
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { name: 'user_id' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp without time zone', nullable: true })
  email_verified_at: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  last_login_at: Date;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  // Added references for Assessor relationships (reverse side)
  // Assessor's assigned assessments
  @OneToMany(() => Assessment, assessment => assessment.assessor)
  assessments: Assessment[];

  @OneToOne(() => AssessorProfile, profile => profile.user)
  assessor_profile: AssessorProfile;

  @OneToOne(() => UserProfile, profile => profile.user)
  user_profile: UserProfile;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];
}
