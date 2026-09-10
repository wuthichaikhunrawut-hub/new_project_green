export interface CarbonLog {
  activity_type: string;
  id: number;
  month: string;
  year: number;
  type: 'Electricity' | 'Water' | 'Fuel' | 'Waste';
  amount: number;
  unit: string;
  emission: number; // ค่า CO2 ที่คำนวณแล้ว
  evidenceUrl?: string; // รูปบิล
  status: 'Draft' | 'Submitted' | 'Approved';
}
