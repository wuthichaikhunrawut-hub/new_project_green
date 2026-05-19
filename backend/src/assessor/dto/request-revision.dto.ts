export class RequestRevisionDto {
  notes: string;
  details?: {
    assessment_detail_id: number;
    auditor_comment?: string;
  }[];
}
