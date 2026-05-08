export interface User {
  id: string; // UUID from backend
  username: string;
  email?: string;
  role: 'ADMIN' | 'USER' | 'EXECUTIVE' | 'ASSESSOR' | 'EMPLOYEE'
    | 'System Admin' | 'Organization Admin' | 'Executive' | 'Employee' | 'Assessor';
  organizationName?: string;
  avatarUrl?: string;
  assessor_verified?: boolean;
}