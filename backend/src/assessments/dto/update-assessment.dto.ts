import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentDto } from './create-assessment.dto';
import { IsOptional, IsArray } from 'class-validator';

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {
  @IsOptional()
  @IsArray()
  details?: {
    assessment_detail_id: number;
    self_score?: number;
    applicant_comment?: string;
    assessor_score?: number;
    auditor_comment?: string;
  }[];
}

