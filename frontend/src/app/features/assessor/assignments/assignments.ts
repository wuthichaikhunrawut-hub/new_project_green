import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestsService } from '../../../core/services/requests.service';
import { Assessment } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-assessor-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assignments.html',
  styles: ``
})
export class AssessorAssignmentsComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private requestsService = inject(RequestsService);

  requests: Assessment[] = [];
  isLoading = true;
  searchTerm = '';
  statusFilter = '';



  get filteredRequests() {
    return this.requests.filter(r => {
      const matchSearch = !this.searchTerm || (r.organization?.name || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  ngOnInit() { this.loadRequests(); }

  loadRequests() {
    this.isLoading = true;
    this.requestsService.getRequests().subscribe({
      next: (data) => { this.requests = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'รอดำเนินการ',
      REVISION_REQUESTED: 'รอแก้ไข',
      APPROVED: 'อนุมัติ',
      REJECTED: 'ปฏิเสธ'
    };
    return map[status] || status;
  }
}
