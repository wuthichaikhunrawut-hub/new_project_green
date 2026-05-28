import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateCarbonLogDto {
  @IsString()
  @IsOptional()
  activity_type?: string;

  @IsNumber()
  @IsOptional()
  month?: number;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  usage_amount?: number;

  @IsNumber()
  @IsOptional()
  total_emission?: number;

  @IsNumber()
  @IsOptional()
  emission_factor_id?: number;

  @IsString()
  @IsOptional()
  evidence_url?: string;

  @IsString()
  @IsOptional()
  data_source?: string;

  @IsNumber()
  @IsOptional()
  org_unit_id?: number;
}
