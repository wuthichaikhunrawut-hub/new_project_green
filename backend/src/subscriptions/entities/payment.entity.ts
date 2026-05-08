import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('increment', { name: 'payment_id' })
  id: number;

  @Column({ name: 'invoice_id', nullable: true })
  invoice_id: number;

  @Column({ name: 'org_id', nullable: true })
  org_id: number;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'THB' })
  currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_status: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  paid_at: Date;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => Invoice, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
