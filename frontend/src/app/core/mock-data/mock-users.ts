import { User } from '../models/user.model';

export const MOCK_USER: User = {
  id: 101,
  username: 'staff_01',
  email: 'staff@example.com',
  role: 'USER',
  organizationName: 'บริษัท กรีน จำกัด',
  is_active: true,
  created_at: new Date().toISOString(),
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
};