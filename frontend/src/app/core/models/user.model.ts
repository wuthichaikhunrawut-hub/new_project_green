export enum UserRole {
  SYSTEM_ADMIN = 'System Admin',
  ORG_ADMIN = 'Organization Admin',
  EXECUTIVE = 'Executive',
  EMPLOYEE = 'Employee',
  ASSESSOR = 'Assessor',
  USER = 'User'
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  role: UserRole | string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  organization?: any; // Will replace with Organization interface soon
  org_unit_id?: number;
  organization_unit?: any; // OrgBranch / OrganizationUnit
  user_profile?: UserProfile;
  organizationName?: string; // For display
  avatarUrl?: string;
  assessor_verified?: boolean;
}
