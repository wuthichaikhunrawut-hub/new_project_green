export class CreateCarbonLogDto {
  activity_type: string;
  month: number;
  year: number;
  usage_amount: number;
  total_emission?: number;
  emission_factor_id?: number;
  evidence_url?: string;
  data_source?: string;
}
