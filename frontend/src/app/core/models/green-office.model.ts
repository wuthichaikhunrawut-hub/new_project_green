export interface GreenCriteria {
  id: number;
  category: number; // หมวด 1-6
  code: string; // เช่น 1.1.1
  name: string;
  maxScore: number;
  currentScore?: number; // คะแนนที่ได้ (Optional)
  status: 'Pending' | 'Completed';
}
