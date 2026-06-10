export enum AssessmentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface AssessmentCriteria {
  id: number;
  category_id?: number;
  category_number?: number;
  category_name?: string;
  sub_category_name?: string;
  criteria_code?: string;
  criteria_name: string;
  description?: string;
  max_score: number;
  current_score?: number;
  status?: 'Pending' | 'Completed';
}

export interface AssessmentDetail {
  id: number;
  assessment_id: number;
  criteria_id: number;
  self_score: number;
  assessor_score: number;
  applicant_comment?: string;
  auditor_comment?: string;
  criteria?: AssessmentCriteria;
  evidence_files?: any[];
}

export interface Assessment {
  id: number;
  org_id: number;
  assessor_user_id?: number;
  assessment_year: number;
  status: AssessmentStatus | string;
  total_score: number;
  certified_level?: string;
  notes?: string;
  submitted_at?: string;
  created_at: string;
  updated_at?: string;
  organization?: any;
  assessor?: any;
  details?: AssessmentDetail[];
  certificates?: any[];
}
