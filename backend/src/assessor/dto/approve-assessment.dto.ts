import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveAssessmentDetailDto {
  @IsNumber()
  assessment_detail_id: number;

  @IsNumber()
  @Min(0)
  assessor_score: number;

  @IsOptional()
  @IsString()
  auditor_comment?: string;
}

export class ApproveAssessmentDto {
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) total_score?: number;
  @IsOptional() @IsString() certified_level?: string;
  @IsOptional() @IsString() certificate_no?: string;
  @IsOptional() @IsString() issued_at?: string;
  @IsOptional() @IsString() expired_at?: string;
  @IsOptional() @IsString() certificate_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveAssessmentDetailDto)
  details?: ApproveAssessmentDetailDto[];
}
