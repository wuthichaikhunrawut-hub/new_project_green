import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { RequestsService } from '../../core/services/requests.service';
import { AuthService } from '../../core/services/auth.service';
import { AssessorsAdminService } from '../../core/services/assessors-admin.service';
import { ToastService } from '../../core/services/toast.service';
import { Assessment, AssessmentStatus } from '../../core/models/assessment.model';
import { ThaiDatePipe } from '../../shared/pipes/thai-date-pipe';


@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThaiDatePipe],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class RequestsComponent implements OnInit, OnDestroy {
  private requestsService = inject(RequestsService);
  private authService = inject(AuthService);
  private assessorsSvc = inject(AssessorsAdminService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private subscription = new Subscription();

  requests: Assessment[] = [];
  isLoading = true;
  isSubmitting = false;
  user: any = null;

  get userRoleKey(): string {
    const role = (this.user?.role || '').toUpperCase().trim().split(' ').join('_');
    if (role === 'SYSTEM_ADMIN' || role === 'ADMIN') return 'SYSTEM_ADMIN';
    if (role === 'ORGANIZATION_ADMIN' || role === 'ORG_ADMIN') return 'ORG_ADMIN';
    if (role === 'ASSESSOR' || role === 'ASSESSOR_ADMIN') return 'ASSESSOR';
    return role;
  }
  
  searchTerm: string = '';
  statusFilter: string = '';
  
  assessorsList: any[] = [];
  selectedReqForAssign: Assessment | null = null;
  targetAssessorId: string = '';
  isAssigning = false;

  get isAssigner(): boolean {
    const role = (this.user?.role || '').toUpperCase().trim().split(' ').join('_');
    return ['SYSTEM_ADMIN', 'ADMIN', 'ASSESSOR_ADMIN'].includes(role);
  }

  get isAllowedToSubmit(): boolean {
    const role = (this.user?.role || '').toUpperCase().trim().split(' ').join('_');
    return ['ORGANIZATION_ADMIN'].includes(role);
  }

  get isOrgAdmin(): boolean {
    const role = (this.user?.role || '').toUpperCase().trim().split(' ').join('_');
    return ['ORGANIZATION_ADMIN', 'ORG_ADMIN'].includes(role);
  }

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        this.loadRequests();
        if (this.isAssigner) {
          this.loadAssessors();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadAssessors() {
    this.assessorsSvc.getAssessors().subscribe({
      next: (data) => {
        this.assessorsList = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load assessors', err)
    });
  }

  openAssignModal(req: Assessment) {
    this.selectedReqForAssign = req;
    this.targetAssessorId = req.assessor_user_id ? String(req.assessor_user_id) : '';
    this.cdr.markForCheck();
  }

  closeAssignModal() {
    this.selectedReqForAssign = null;
    this.targetAssessorId = '';
    this.cdr.markForCheck();
  }

  confirmAssign() {
    if (!this.selectedReqForAssign) return;
    this.isAssigning = true;
    
    const assessorId = this.targetAssessorId ? Number(this.targetAssessorId) : null;
    
    this.requestsService.updateRequest(this.selectedReqForAssign.id, {
      assessor_user_id: assessorId as any
    }).subscribe({
      next: () => {
        this.isAssigning = false;
        this.toast.success('มอบหมายงานตรวจประเมินเรียบร้อยแล้ว');
        this.closeAssignModal();
        this.loadRequests();
      },
      error: (err) => {
        console.error('Failed to assign assessor', err);
        this.toast.error('เกิดข้อผิดพลาดในการมอบหมายงาน');
        this.isAssigning = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadRequests() {
    this.isLoading = true;
    this.requests = [];
    this.requestsService.getRequests().subscribe({
      next: (data) => {
        this.requests = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to load requests', err);
        this.requests = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredRequests(): Assessment[] {
    return this.requests.filter(req => {
      const matchStatus = this.statusFilter ? req.status === this.statusFilter : true;
      const orgName = req['organization']?.name || '';
      const matchSearch = this.searchTerm ? orgName.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;
      return matchStatus && matchSearch;
    });
  }



  getStatusBadgeClass(status: string): string {
    const base = 'status-badge ';
    switch (status) {
      case 'APPROVED': return base + 'status-approved';
      case 'PENDING': return base + 'status-pending';
      case 'SUBMITTED': return base + 'status-submitted';
      case 'REVISION_REQUESTED': return base + 'status-revision';
      case 'REJECTED': return base + 'status-rejected';
      default: return base + 'status-draft';
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
