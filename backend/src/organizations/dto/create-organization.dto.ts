import { IsString, IsOptional, IsNumber, IsBoolean, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{13}$/, { message: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก' })
  tax_id?: string;

  @IsString()
  @IsOptional()
  industry_type?: string;

  @IsNumber()
  @IsOptional()
  number_of_employees?: number;

  @IsNumber()
  @IsOptional()
  total_floor_area?: number;

  @IsNumber()
  @IsOptional()
  working_hours_per_year?: number;

  @IsNumber()
  @IsOptional()
  base_year?: number;

  @IsNumber()
  @IsOptional()
  target_reduction_percent?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  current_green_status?: string;
}
