import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RequestsService, CertificationRequest } from '../../core/services/requests.service';
import { AuthService } from '../../core/services/auth.service';
import { ThaiDatePipe } from '../../shared/pipes/thai-date-pipe';


@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThaiDatePipe],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class RequestsComponent implements OnInit {
  private requestsService = inject(RequestsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  requests: CertificationRequest[] = [];
  isLoading = true;
  isSubmitting = false;
  user = this.authService.getUser();
  
  searchTerm: string = '';
  statusFilter: string = '';

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.requests = [];
    this.requestsService.getRequests().subscribe({
      next: (data) => {
        this.requests = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load requests', err);
        this.requests = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredRequests(): CertificationRequest[] {
    return this.requests.filter(req => {
      const matchStatus = this.statusFilter ? req.status === this.statusFilter : true;
      const orgName = req['organization']?.name || '';
      const matchSearch = this.searchTerm ? orgName.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;
      return matchStatus && matchSearch;
    });
  }



  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-success';
      case 'PENDING': return 'bg-warning text-dark';
      case 'REVISION_REQUESTED': return 'bg-info text-dark';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED': return 'ผ่านการรับรอง';
      case 'PENDING': return 'รอการตรวจประเมิน';
      case 'REVISION_REQUESTED': return 'ข้อมูลไม่สมบูรณ์ (รอแก้ไข)';
      case 'REJECTED': return 'ไม่ผ่านเกณฑ์';
      default: return 'แบบร่าง';
    }
  }
}
