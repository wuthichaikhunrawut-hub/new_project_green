import { Entity, PrimaryColumn } from 'typeorm';

@Entity('user_roles')
export class UserRole {
  @PrimaryColumn({ name: 'user_id' })
  user_id: number;

  @PrimaryColumn({ name: 'role_id' })
  role_id: number;
}
