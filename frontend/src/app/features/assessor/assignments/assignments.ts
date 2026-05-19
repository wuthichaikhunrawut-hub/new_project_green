import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { AssessorAssignmentItem } from '../../../core/models/assessor.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-assessor-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css',
})
export class AssessorAssignmentsComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  assignments: AssessorAssignmentItem[] = [];
  isLoading = true;
  searchTerm = '';
  statusFilter = '';
  yearFilter = '';
  viewMode: 'list' | 'grid' = 'list';

  get availableYears(): number[] {
    const years = new Set(this.assignments.map(a => a.assessmentYear));
    return Array.from(years).sort((a, b) => b - a);
  }

  get filteredAssignments(): AssessorAssignmentItem[] {
    return this.assignments.filter(item => {
      const matchSearch = !this.searchTerm ||
        item.orgName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchYear = !this.yearFilter || String(item.assessmentYear) === this.yearFilter;
      return matchSearch && matchStatus && matchYear;
    });
  }

  get countByStatus(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const a of this.assignments) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return counts;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.assessorService.getAssignments().subscribe({
      next: (data) => {
        this.assignments = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดรายการไม่สำเร็จ');
        this.cdr.markForCheck();
      },
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.yearFilter = '';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'รอดำเนินการ', SUBMITTED: 'ส่งแล้ว',
      IN_REVIEW: 'กำลังตรวจ', REVISION_REQUESTED: 'รอแก้ไข',
      APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ',
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

  getScopeColor(scope: number): string {
    return ['', '#0ea5e9', '#059669', '#8b5cf6'][scope] ?? '#6b7280';
  }

  scopeBarWidth(value: number, total: number): string {
    if (!total) return '0%';
    return `${Math.min(100, Math.round((value / total) * 100))}%`;
  }

  getDaysWaiting(item: AssessorAssignmentItem): number {
    if (!item.submittedAt) return 0;
    return Math.floor((Date.now() - new Date(item.submittedAt).getTime()) / 86400000);
  }

  isNearDeadline(item: AssessorAssignmentItem): boolean {
    return this.getDaysWaiting(item) >= 10 && !['APPROVED', 'REJECTED'].includes(item.status);
  }

  getScorePercent(item: AssessorAssignmentItem): number {
    // totalScore from backend is raw score; treat max as 100 for display
    return Math.min(100, Math.round(item.totalScore));
  }

  getCertLevel(score: number): string {
    if (score >= 90) return '🥇 ทอง';
    if (score >= 70) return '🥈 เงิน';
    if (score >= 50) return '🥉 ทองแดง';
    return '-';
  }
}
