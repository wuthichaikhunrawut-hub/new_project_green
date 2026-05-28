import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCarbonLogDto {
  @IsString()
  activity_type: string;

  @IsNumber()
  month: number;

  @IsNumber()
  year: number;

  @IsNumber()
  usage_amount: number;

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
