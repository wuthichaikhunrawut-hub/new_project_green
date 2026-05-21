import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutiveService } from '../../../core/services/executive.service';
import {
  CarbonScopePoint,
  CarbonUnitPoint,
  ExecutiveDashboardResponse,
} from '../../../core/models/executive.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class ExecutiveDashboardComponent implements OnInit {
  private readonly executiveService = inject(ExecutiveService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  data: ExecutiveDashboardResponse | null = null;
  certificate: any = null;
  waitingForCertificate = false;

  ngOnInit(): void {
    this.load();
  }

  get latestCertificate(): any {
    if (!this.data || !this.data.approvedAssessments) return null;
    return this.data.approvedAssessments.find(a => a.certificateUrl) || null;
  }

  /** ยอดคาร์บอนรวมทุก scope */
  get totalCarbonEmission(): number {
    if (!this.data?.carbonByScope?.length) return 0;
    return this.data.carbonByScope.reduce((sum, p) => sum + p.totalEmission, 0);
  }

  /** ยอดคาร์บอนรวมทุก unit (สำหรับคำนวณ % share) */
  get totalUnitEmission(): number {
    if (!this.data?.carbonByUnit?.length) return 0;
    return this.data.carbonByUnit.reduce((sum, u) => sum + u.totalEmission, 0);
  }

  load(): void {
    this.isLoading = true;
    this.executiveService.getDashboard().subscribe({
      next: (response) => {
        this.data = response;
        this.isLoading = false;

        const approved = this.data.approvedAssessments?.[0];
        if (approved) {
          if (approved.certificateUrl || approved.certificateNo) {
            this.certificate = approved;
            this.waitingForCertificate = false;
          } else {
            this.waitingForCertificate = true;
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('โหลดรายงานผู้บริหารไม่สำเร็จ');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  pointsByScope(scope: number): CarbonScopePoint[] {
    if (!this.data) return [];
    return this.data.carbonByScope.filter((point) => point.scope === scope);
  }

  /** ผลรวม emission ของ scope นั้น */
  scopeTotal(scope: number): number {
    return this.pointsByScope(scope).reduce((sum, p) => sum + p.totalEmission, 0);
  }

  maxEmission(points: CarbonScopePoint[]): number {
    if (!points.length) return 0;
    return Math.max(...points.map((point) => point.totalEmission));
  }

  barWidth(point: CarbonScopePoint, max: number): string {
    if (max <= 0) return '5%';
    return `${Math.max(5, Math.round((point.totalEmission / max) * 100))}%`;
  }

  get maxUnitEmission(): number {
    if (!this.data?.carbonByUnit?.length) return 0;
    return Math.max(...this.data.carbonByUnit.map(u => u.totalEmission));
  }

  unitBarWidth(emission: number, max: number): string {
    if (max <= 0) return '5%';
    return `${Math.max(5, Math.round((emission / max) * 100))}%`;
  }
}
