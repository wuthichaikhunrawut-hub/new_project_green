import { Assessment, AssessmentDetail } from './assessment.model';

export interface ScopeEmissionSummary {
  scope: number;
  label: string;
  totalEmission: number;
  logCount: number;
}

export interface OrgCarbonSummary {
  orgId: number;
  orgName: string;
  scopes: ScopeEmissionSummary[];
  totalEmission: number;
}

export interface AssessorDashboardStats {
  pending: number;
  inReview: number;
  revisionRequested: number;
  completed: number;
  nearDeadline: number;
  avgScorePercent: number;
}

export interface AssessorAssignmentItem {
  id: number;
  orgId: number;
  orgName: string;
  assessmentYear: number;
  status: string;
  totalScore: number;
  submittedAt: string | null;
  carbonSummary: OrgCarbonSummary;
  hasCertificate?: boolean;
}

export interface AssessorDashboardResponse {
  stats: AssessorDashboardStats;
  assignments: AssessorAssignmentItem[];
}

export interface EvidenceReviewItem {
  assessment_detail_id: number;
  criteria_code?: string;
  criteria_name?: string;
  max_score: number;
  evidence_files: EvidenceFileView[];
  comment: string;
  result: 'PASS' | 'FAIL' | null;
}

export interface EvidenceFileView {
  id: number;
  file_name?: string;
  file_url?: string;
  file_type?: string;
  category?: string;
}

export interface ScoreReviewItem {
  assessment_detail_id: number;
  criteria_code?: string;
  criteria_name?: string;
  assessor_score: number;
  max_score: number;
  auditor_comment: string;
}

export interface SaveEvidenceReviewPayload {
  details: {
    assessment_detail_id: number;
    result: 'PASS' | 'FAIL';
    auditor_comment?: string;
    assessor_score?: number;
  }[];
}

export interface ApproveAssessmentPayload {
  notes?: string;
  total_score?: number;
  certified_level?: string;
  details?: {
    assessment_detail_id: number;
    assessor_score: number;
    auditor_comment?: string;
  }[];
}

export interface RequestRevisionPayload {
  notes: string;
  details?: {
    assessment_detail_id: number;
    auditor_comment?: string;
  }[];
}

export type AssessorAssessment = Assessment & {
  details?: (AssessmentDetail & { evidence_files?: EvidenceFileView[] })[];
};
