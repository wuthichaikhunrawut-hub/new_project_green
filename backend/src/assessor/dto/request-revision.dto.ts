import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RevisionDetailDto {
  @IsNumber() assessment_detail_id: number;
  @IsOptional() @IsString() auditor_comment?: string;
}

export class RequestRevisionDto {
  @IsString() notes: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevisionDetailDto)
  details?: RevisionDetailDto[];
}
