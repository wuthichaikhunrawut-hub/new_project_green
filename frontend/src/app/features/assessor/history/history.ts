import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestsService } from '../../../core/services/requests.service';

@Component({
  selector: 'app-assessor-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.html',
  styles: ``
})
export class AssessorHistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private requestsService = inject(RequestsService);

  history: any[] = [];
  isLoading = true;
  searchTerm = '';
  statusFilter = '';
  yearFilter = '';
  years: number[] = [];

  get filteredHistory() {
    return this.history.filter(r => {
      const matchSearch = !this.searchTerm || (r.organization?.name || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      const matchYear = !this.yearFilter || String(r.assessment_year) === this.yearFilter;
      return matchSearch && matchStatus && matchYear;
    });
  }

  ngOnInit() { this.loadHistory(); }

  loadHistory() {
    this.requestsService.getRequests().subscribe({
      next: (data) => {
        this.history = data.filter(r => ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(r.status));
        this.years = [...new Set(this.history.map(r => r.assessment_year).filter(Boolean))].sort((a, b) => b - a);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ', REVISION_REQUESTED: 'ส่งกลับแก้ไข'
    };
    return map[status] || status;
  }
}
