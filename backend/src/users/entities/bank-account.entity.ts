import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('increment', { name: 'bank_account_id' })
  id: number;

  @Column({ name: 'user_id', nullable: true })
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  account_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
