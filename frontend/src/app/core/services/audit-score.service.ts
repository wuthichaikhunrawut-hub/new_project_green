import { Injectable } from '@angular/core';

export interface ScoreIndicatorInput {
  code: string;
  title: string;
  hasEvidence: boolean;
  hasExecutiveApproval: boolean;
  isCurrentDate: boolean;
  isRenewal?: boolean;
  historyYearsAvailable?: number;
}

export interface ScoreIndicatorResult {
  code: string;
  title: string;
  score: 0 | 1 | 2 | 3 | 4;
  statusLabel: string;
}

export interface ScorePredictionSummary {
  indicators: ScoreIndicatorResult[];
  totalScore: number;
  maxScore: number;
  percent: number;
  level: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Needs Work';
  readyForAudit: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuditScoreService {
  evaluateIndicator(input: ScoreIndicatorInput): ScoreIndicatorResult {
    const { hasEvidence, hasExecutiveApproval, isCurrentDate } = input;

    if (hasEvidence && hasExecutiveApproval && isCurrentDate) {
      return {
        code: input.code,
        title: input.title,
        score: 4,
        statusLabel: 'ครบหลักฐาน + ลงนาม + เป็นปัจจุบัน',
      };
    }

    if (input.isRenewal) {
      const years = Math.max(0, input.historyYearsAvailable ?? 0);
      const base = hasEvidence ? 1 : 0;
      const historyBonus = years >= 3 ? 2 : years >= 1 ? 1 : 0;
      const approvalBonus = hasExecutiveApproval ? 1 : 0;
      const score = Math.min(3, base + historyBonus + approvalBonus) as 0 | 1 | 2 | 3;

      return {
        code: input.code,
        title: input.title,
        score,
        statusLabel:
          score >= 3 ? 'ต่ออายุ: ข้อมูลย้อนหลังเพียงพอ' : 'ต่ออายุ: ข้อมูลย้อนหลังยังไม่ครบ',
      };
    }

    const evidenceScore = hasEvidence ? 2 : 0;
    const approvalScore = hasExecutiveApproval ? 1 : 0;
    const dateScore = isCurrentDate ? 1 : 0;
    const score = Math.min(3, evidenceScore + approvalScore + dateScore) as 0 | 1 | 2 | 3;

    return {
      code: input.code,
      title: input.title,
      score,
      statusLabel: score === 0 ? 'ยังไม่เริ่ม' : 'กำลังจัดเตรียมหลักฐาน',
    };
  }

  summarize(inputs: ScoreIndicatorInput[]): ScorePredictionSummary {
    const indicators = inputs.map((i) => this.evaluateIndicator(i));
    const totalScore = indicators.reduce((sum, i) => sum + i.score, 0);
    const maxScore = inputs.length * 4;
    const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const level = this.mapLevel(percent);
    const readyForAudit = percent >= 85;

    return {
      indicators,
      totalScore,
      maxScore,
      percent,
      level,
      readyForAudit,
    };
  }

  private mapLevel(percent: number): ScorePredictionSummary['level'] {
    if (percent >= 85) return 'Platinum';
    if (percent >= 70) return 'Gold';
    if (percent >= 55) return 'Silver';
    if (percent >= 40) return 'Bronze';
    return 'Needs Work';
  }
}
