import { PartialType } from '@nestjs/mapped-types';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  username?: string;
  email?: string;
  role?: UserRole | string;
  is_active?: boolean;
  password?: string;
  organization?: { id: number };
  org_unit_id?: number;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    profile_image?: string;
  };
}
