export enum OrgType {
  GOVERNMENT = 'GOVERNMENT',
  STATE_ENTERPRISE = 'STATE_ENTERPRISE',
  PRIVATE = 'PRIVATE',
  EDUCATION = 'EDUCATION',
  INDUSTRIAL = 'INDUSTRIAL',
  INDUSTRIAL_OFFICE = 'INDUSTRIAL_OFFICE',
  LOCAL_ADMIN = 'LOCAL_ADMIN'
}

export interface Organization {
  id: number;
  name: string;
  tax_id?: string;
  industry_type: OrgType | string;
  address?: string;
  phone?: string;
  email?: string;
  total_floor_area?: number;
  number_of_employees?: number;
  base_year?: number;
  target_reduction_percent?: number;
  current_green_status?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
