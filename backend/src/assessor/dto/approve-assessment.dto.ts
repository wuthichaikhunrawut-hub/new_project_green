export class ApproveAssessmentDto {
  notes?: string;
  total_score?: number;
  certified_level?: string;
  certificate_no?: string;
  issued_at?: string;
  expired_at?: string;
  certificate_url?: string;
  details?: {
    assessment_detail_id: number;
    assessor_score: number;
    auditor_comment?: string;
  }[];
}
