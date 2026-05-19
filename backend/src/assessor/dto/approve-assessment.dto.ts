export class ApproveAssessmentDto {
  notes?: string;
  total_score?: number;
  certified_level?: string;
  details?: {
    assessment_detail_id: number;
    assessor_score: number;
    auditor_comment?: string;
  }[];
}
