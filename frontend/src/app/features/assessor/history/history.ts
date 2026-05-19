import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { AssessorAssignmentItem } from '../../../core/models/assessor.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-assessor-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.html',
})
export class AssessorHistoryComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  history: AssessorAssignmentItem[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.assessorService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดประวัติไม่สำเร็จ');
        this.cdr.detectChanges();
      },
    });
  }

  statusLabel(status: string): string {
    return status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ';
  }
}
