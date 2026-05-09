export class CreateOrganizationDto {
  name: string;
  tax_id?: string;
  industry_type?: string;
  number_of_employees?: number;
  total_floor_area?: number;
  working_hours_per_year?: number;
  base_year?: number;
  target_reduction_percent?: number;
}
