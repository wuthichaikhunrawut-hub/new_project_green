import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment', { name: 'role_id' })
  id: number;

  @Column({ name: 'role_name', type: 'varchar', length: 50, unique: true })
  role_name: string;
}
