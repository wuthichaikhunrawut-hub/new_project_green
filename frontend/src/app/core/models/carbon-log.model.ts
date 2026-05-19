export enum ActivityType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  WASTE = 'WASTE',
  FUEL = 'FUEL',
  GAS = 'GAS'
}

export interface EmissionFactor {
  id: number;
  name: string;
  category: string;
  scope?: number;
  unit: string;
  factor_value: number;
  is_active: boolean;
}

export interface CarbonLog {
  id: number;
  activity_type: ActivityType | string;
  month: number;
  year: number;
  usage_amount: number;
  total_emission: number;
  evidence_url?: string;
  data_source?: string;
  created_at: string;
  emission_factor?: EmissionFactor;
  organization?: any;
}
