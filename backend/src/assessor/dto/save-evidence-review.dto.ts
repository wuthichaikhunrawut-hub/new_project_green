import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EvidenceReviewDetailDto {
  @IsNumber() assessment_detail_id: number;
  @IsIn(['PASS', 'FAIL']) result: 'PASS' | 'FAIL';
  @IsOptional() @IsString() auditor_comment?: string;
  @IsOptional() @IsNumber() @Min(0) assessor_score?: number;
}

export class SaveEvidenceReviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceReviewDetailDto)
  details: EvidenceReviewDetailDto[];
}
