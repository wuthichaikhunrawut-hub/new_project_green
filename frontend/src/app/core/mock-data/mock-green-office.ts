import { AssessmentCriteria as GreenCriteria } from '../models/assessment.model';

export const MOCK_CRITERIA: GreenCriteria[] = [
  { id: 1, category_number: 1, criteria_code: '1.1', criteria_name: 'การกำหนดนโยบายสิ่งแวดล้อม', max_score: 5, current_score: 0, status: 'Pending' },
  { id: 2, category_number: 1, criteria_code: '1.2', criteria_name: 'การสื่อสารนโยบาย', max_score: 5, current_score: 0, status: 'Pending' },
  { id: 3, category_number: 2, criteria_code: '2.1', criteria_name: 'การสื่อสารและการสร้างจิตสำนึก', max_score: 10, current_score: 0, status: 'Pending' },
  { id: 4, category_number: 3, criteria_code: '3.1', criteria_name: 'การจัดการทรัพยากรน้ำ', max_score: 10, current_score: 0, status: 'Pending' },
];