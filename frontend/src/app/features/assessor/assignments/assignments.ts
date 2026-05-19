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
})
export class AssessorAssignmentsComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  assignments: AssessorAssignmentItem[] = [];
  isLoading = true;
  searchTerm = '';
  statusFilter = '';

  get filteredAssignments(): AssessorAssignmentItem[] {
    return this.assignments.filter((item) => {
      const matchSearch =
        !this.searchTerm ||
        item.orgName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || item.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.assessorService.getAssignments().subscribe({
      next: (data) => {
        this.assignments = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดรายการไม่สำเร็จ');
        this.cdr.detectChanges();
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'รอดำเนินการ',
      SUBMITTED: 'ส่งแล้ว',
      IN_REVIEW: 'กำลังตรวจ',
      REVISION_REQUESTED: 'รอแก้ไข',
      APPROVED: 'อนุมัติ',
      REJECTED: 'ปฏิเสธ',
    };
    return map[status] ?? status;
  }
}
