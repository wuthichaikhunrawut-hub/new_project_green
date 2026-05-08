import { GreenCriteria } from '../models/green-office.model';

export const MOCK_CRITERIA: GreenCriteria[] = [
  { id: 1, category: 1, code: '1.1', name: 'การกำหนดนโยบายสิ่งแวดล้อม', maxScore: 5, currentScore: 0, status: 'Pending' },
  { id: 2, category: 1, code: '1.2', name: 'การสื่อสารนโยบาย', maxScore: 5, currentScore: 0, status: 'Pending' },
  { id: 3, category: 2, code: '2.1', name: 'การสื่อสารและการสร้างจิตสำนึก', maxScore: 10, currentScore: 0, status: 'Pending' },
  { id: 4, category: 3, code: '3.1', name: 'การจัดการทรัพยากรน้ำ', maxScore: 10, currentScore: 0, status: 'Pending' },
];