import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AuditScoreService,
  ScoreIndicatorInput,
  ScorePredictionSummary,
} from '../../../core/services/audit-score.service';

@Component({
  selector: 'app-score-prediction-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-prediction-dashboard.html',
  styleUrls: ['./score-prediction-dashboard.css'],
})
export class ScorePredictionDashboardComponent {
  @Input({ required: true }) indicators: ScoreIndicatorInput[] = [];

  constructor(private auditScoreService: AuditScoreService) {}

  get summary(): ScorePredictionSummary {
    return this.auditScoreService.summarize(this.indicators);
  }

  get circleDasharray(): string {
    const percent = this.summary.percent;
    const clamped = Math.max(0, Math.min(100, percent));
    return `${clamped}, 100`;
  }

  get levelClass(): string {
    const level = this.summary.level;
    if (level === 'Platinum') return 'text-emerald-700 bg-emerald-50/60 border-emerald-200/50';
    if (level === 'Gold') return 'text-amber-700 bg-amber-50/60 border-amber-200/50';
    if (level === 'Silver') return 'text-slate-700 bg-slate-50/60 border-slate-200/50';
    if (level === 'Bronze') return 'text-orange-700 bg-orange-50/60 border-orange-200/50';
    return 'text-rose-700 bg-rose-50/60 border-rose-200/50';
  }
}
