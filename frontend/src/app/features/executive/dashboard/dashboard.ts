import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutiveService } from '../../../core/services/executive.service';
import {
  CarbonScopePoint,
  ExecutiveDashboardResponse,
} from '../../../core/models/executive.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class ExecutiveDashboardComponent implements OnInit {
  private readonly executiveService = inject(ExecutiveService);
  private readonly toast = inject(ToastService);

  isLoading = true;
  data: ExecutiveDashboardResponse | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.executiveService.getDashboard().subscribe({
      next: (response) => {
        this.data = response;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('โหลดรายงานผู้บริหารไม่สำเร็จ');
        this.isLoading = false;
      },
    });
  }

  pointsByScope(scope: number): CarbonScopePoint[] {
    if (!this.data) return [];
    return this.data.carbonByScope.filter((point) => point.scope === scope);
  }

  maxEmission(points: CarbonScopePoint[]): number {
    if (!points.length) return 0;
    return Math.max(...points.map((point) => point.totalEmission));
  }

  barWidth(point: CarbonScopePoint, max: number): string {
    if (max <= 0) return '0%';
    return `${Math.round((point.totalEmission / max) * 100)}%`;
  }
}
