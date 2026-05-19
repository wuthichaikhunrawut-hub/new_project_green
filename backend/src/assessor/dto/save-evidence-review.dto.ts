export class SaveEvidenceReviewDto {
  details: {
    assessment_detail_id: number;
    result: 'PASS' | 'FAIL';
    auditor_comment?: string;
    assessor_score?: number;
  }[];
}
