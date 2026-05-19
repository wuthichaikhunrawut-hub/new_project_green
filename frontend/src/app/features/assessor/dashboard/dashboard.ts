import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { AuthService } from '../../../core/services/auth.service';
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
  styleUrl: './dashboard.css',
})
export class AssessorDashboardComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  stats: AssessorDashboardStats = {
    pending: 0, inReview: 0, revisionRequested: 0,
    completed: 0, nearDeadline: 0, avgScorePercent: 0,
  };
  assignments: AssessorAssignmentItem[] = [];

  get currentUser() { return this.authService.getUser(); }
  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์';
    if (h < 18) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  }

  get nearDeadlineItems(): AssessorAssignmentItem[] {
    return this.assignments.filter(a => this.getDaysWaiting(a) >= 10 &&
      !['APPROVED', 'REJECTED'].includes(a.status));
  }

  get activeItems(): AssessorAssignmentItem[] {
    return this.assignments.filter(a =>
      !['APPROVED', 'REJECTED'].includes(a.status) && this.getDaysWaiting(a) < 10
    ).slice(0, 5);
  }

  ngOnInit(): void { this.loadDashboard(); }

  loadDashboard(): void {
    this.isLoading = true;
    this.assessorService.getDashboard().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.assignments = data.assignments;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดแดชบอร์ดไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
        this.cdr.markForCheck();
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'รอตรวจ', SUBMITTED: 'ส่งแล้ว', IN_REVIEW: 'กำลังตรวจ',
      REVISION_REQUESTED: 'รอแก้ไข', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-pending', SUBMITTED: 'badge-submitted',
      IN_REVIEW: 'badge-review', REVISION_REQUESTED: 'badge-revision',
      APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
    };
    return map[status] ?? 'badge-pending';
  }

  getDaysWaiting(item: AssessorAssignmentItem): number {
    if (!item.submittedAt) return 0;
    const ms = Date.now() - new Date(item.submittedAt).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  getScopeColor(scope: number): string {
    return ['', '#0ea5e9', '#059669', '#8b5cf6'][scope] ?? '#6b7280';
  }

  scopeBarWidth(value: number, total: number): string {
    if (!total) return '0%';
    return `${Math.min(100, Math.round((value / total) * 100))}%`;
  }

  getCertLevelFromScore(score: number): string {
    if (score >= 90) return '🥇 ทอง';
    if (score >= 70) return '🥈 เงิน';
    if (score >= 50) return '🥉 ทองแดง';
    return '-';
  }
}
