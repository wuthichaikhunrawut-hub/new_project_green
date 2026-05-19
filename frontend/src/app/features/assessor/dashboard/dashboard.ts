import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import {
  AssessorAssignmentItem,
  AssessorDashboardStats,
} from '../../../core/models/assessor.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-assessor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class AssessorDashboardComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  stats: AssessorDashboardStats = {
    pending: 0,
    inReview: 0,
    revisionRequested: 0,
    completed: 0,
    nearDeadline: 0,
    avgScorePercent: 0,
  };
  assignments: AssessorAssignmentItem[] = [];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.assessorService.getDashboard().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.assignments = data.assignments.slice(0, 6);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดแดชบอร์ดไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
        this.cdr.detectChanges();
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'รอตรวจ',
      SUBMITTED: 'ส่งแล้ว',
      IN_REVIEW: 'กำลังตรวจ',
      REVISION_REQUESTED: 'รอแก้ไข',
      APPROVED: 'อนุมัติ',
      REJECTED: 'ปฏิเสธ',
    };
    return map[status] ?? status;
  }

  scopeBarWidth(value: number, total: number): string {
    if (!total) return '0%';
    return `${Math.min(100, Math.round((value / total) * 100))}%`;
  }
}
