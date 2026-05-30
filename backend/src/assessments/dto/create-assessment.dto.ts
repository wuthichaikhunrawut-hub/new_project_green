import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAssessmentDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  total_score?: number;

  @IsOptional()
  @IsString()
  certified_level?: string;

  @IsOptional()
  @IsNumber()
  assessment_year?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  assessor_user_id?: number | null;
}
