import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface MonthlyGhgDatum {
  monthLabel: string;
  totalKgCo2e: number;
  targetKgCo2e: number;
}

export interface AiInsightCardResult {
  status: 'Achieved' | 'Not Achieved';
  deltaKgCo2e?: number;
  deltaPercent?: number;
  rootCauseAnalysis?: string;
  smartRecommendations: string[];
  important: boolean;
}

@Component({
  selector: 'app-ai-insight-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-insight-card.html',
  styleUrls: ['./ai-insight-card.css'],
})
export class AiInsightCardComponent {
  @Input({ required: true }) data: MonthlyGhgDatum[] = [];
  @Input() title = 'AI Insight';
  @Input() criteriaRef = 'Green Office 2569: 1.5.2, 1.5.3 / 1.6.1';

  get latest(): MonthlyGhgDatum | null {
    if (!this.data || this.data.length === 0) return null;
    return this.data[this.data.length - 1];
  }

  get previous(): MonthlyGhgDatum | null {
    if (!this.data || this.data.length < 2) return null;
    return this.data[this.data.length - 2];
  }

  get insight(): AiInsightCardResult | null {
    const latest = this.latest;
    if (!latest) return null;

    const status: AiInsightCardResult['status'] =
      latest.totalKgCo2e <= latest.targetKgCo2e ? 'Achieved' : 'Not Achieved';

    const prev = this.previous;
    const deltaKgCo2e = prev ? latest.totalKgCo2e - prev.totalKgCo2e : undefined;
    const deltaPercent =
      prev && prev.totalKgCo2e > 0 ? (deltaKgCo2e! / prev.totalKgCo2e) * 100 : undefined;

    const overTargetKg = latest.totalKgCo2e - latest.targetKgCo2e;

    let rootCauseAnalysis: string | undefined;
    if (status === 'Not Achieved') {
      const increasing = typeof deltaKgCo2e === 'number' ? deltaKgCo2e > 0 : true;
      if (increasing) {
        rootCauseAnalysis =
          'การปล่อยก๊าซสูงขึ้นสัมพันธ์กับการใช้พลังงานเพิ่มขึ้น (เช่น อุปกรณ์ทำความเย็น/แสงสว่าง) หรือกิจกรรมในสำนักงานเพิ่มขึ้นในช่วงเดือนนี้';
      } else {
        rootCauseAnalysis =
          'แม้แนวโน้มลดลงจากเดือนก่อน แต่ยังเกินเป้าหมาย อาจเกิดจากฐานการใช้พลังงาน/เชื้อเพลิงที่ยังสูง หรือการปรับตั้งค่าอาคารยังไม่เหมาะสม';
      }
    }

    const smartRecommendations: string[] = [];
    if (status === 'Achieved') {
      smartRecommendations.push(
        'รักษามาตรการที่ทำให้ผ่านเป้าหมาย และตั้งเป้าลดลงต่อเนื่อง (Net Zero Roadmap)',
      );
      smartRecommendations.push(
        'ทำการทบทวนปัจจัยการปล่อย (EF) และตรวจสอบความถูกต้องของหลักฐานทุกเดือน',
      );
    } else {
      smartRecommendations.push(
        'ทำ Energy Walkthrough: ตรวจสอบ HVAC, เวลาเปิด-ปิด, setpoint และอุปกรณ์ที่กินไฟสูง',
      );
      smartRecommendations.push(
        'ตั้งมาตรการควบคุมการใช้พลังงานรายสัปดาห์ พร้อมผู้รับผิดชอบและ KPI ตามหมวด 1.6.1',
      );
      smartRecommendations.push(
        'จัดทำแผนลดการปล่อยที่มีผลลัพธ์วัดได้ (เช่น เปลี่ยนหลอด LED, ปรับปรุงฉนวน, ตั้งโหมดประหยัดพลังงาน)',
      );
    }

    const important =
      status === 'Not Achieved' &&
      (overTargetKg >= latest.targetKgCo2e * 0.1 || overTargetKg >= 50);

    return {
      status,
      deltaKgCo2e,
      deltaPercent,
      rootCauseAnalysis,
      smartRecommendations,
      important,
    };
  }

  get statusClasses(): string {
    const insight = this.insight;
    if (!insight) return '';
    return insight.status === 'Achieved'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40'
      : 'bg-rose-500/10 text-rose-700 border-rose-300/40';
  }
}
