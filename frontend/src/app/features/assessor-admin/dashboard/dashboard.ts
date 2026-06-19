import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessorsAdminService, AssessorUser } from '../../../core/services/assessors-admin.service';
import { RequestsService } from '../../../core/services/requests.service';
import { ToastService } from '../../../core/services/toast.service';
import { Assessment } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private adminService = inject(AssessorsAdminService);
  private requestsService = inject(RequestsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Stats
  stats = {
    totalAssessors: 0,
    assigned: 0,
    unassigned: 0,
    inReview: 0,
    completed: 0,
    approved: 0,
    globalApprovalRate: 0,
    recentAssignments: 0,
  };

  assessments: Assessment[] = [];
  assessors: AssessorUser[] = [];
  
  // UI State
  isLoading = true;
  isProcessingAssign = false;
  isProcessingPayout = false;
  
  // Assignment Modal/Selection state
  selectedAssessmentId: number | null = null;
  selectedAssessorId: number | null = null;
  showAssignModal = false;

  // Payout input states
  payoutAmounts: { [assessorId: string]: number } = {};

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    // 1. Fetch Stats
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.toast.error('ไม่สามารถโหลดข้อมูลสถิติแดชบอร์ดได้');
      }
    });

    // 2. Fetch Assessments
    this.requestsService.getRequests().subscribe({
      next: (data) => {
        this.assessments = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load assessments', err);
        this.toast.error('ไม่สามารถโหลดรายการแบบประเมินได้');
      }
    });

    // 3. Fetch Assessors
    this.adminService.getAssessors().subscribe({
      next: (data) => {
        this.assessors = data;
        // Initialize payout amount inputs
        this.assessors.forEach(a => {
          this.payoutAmounts[a.id] = 1000; // default payout amount
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load assessors', err);
        this.toast.error('ไม่สามารถโหลดข้อมูลผู้ประเมินได้');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openAssignModal(assessmentId: number) {
    this.selectedAssessmentId = assessmentId;
    this.selectedAssessorId = this.assessors.length > 0 ? Number(this.assessors[0].id) : null;
    this.showAssignModal = true;
    this.cdr.markForCheck();
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedAssessmentId = null;
    this.selectedAssessorId = null;
    this.cdr.markForCheck();
  }

  submitAssignment() {
    if (!this.selectedAssessmentId || !this.selectedAssessorId) {
      this.toast.error('กรุณาเลือกผู้ประเมิน');
      return;
    }

    this.isProcessingAssign = true;
    this.cdr.markForCheck();

    this.adminService.assignAssessor(this.selectedAssessmentId, this.selectedAssessorId).subscribe({
      next: (res) => {
        this.toast.success('มอบหมายผู้ประเมินเรียบร้อยแล้ว');
        this.closeAssignModal();
        this.isProcessingAssign = false;
        this.loadAllData();
      },
      error: (err) => {
        console.error('Assignment failed', err);
        this.toast.error('เกิดข้อผิดพลาดในการมอบหมายผู้ประเมิน');
        this.isProcessingAssign = false;
        this.cdr.markForCheck();
      }
    });
  }

  processPayout(assessorId: string) {
    const amount = this.payoutAmounts[assessorId];
    if (!amount || amount <= 0) {
      this.toast.error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    this.isProcessingPayout = true;
    this.cdr.markForCheck();

    this.adminService.processPayout(Number(assessorId), amount).subscribe({
      next: (res) => {
        this.toast.success(`ทำรายการ Payout จำนวน ฿${amount.toLocaleString()} สำเร็จ! ID: ${res.id}`);
        this.isProcessingPayout = false;
        this.loadAllData();
      },
      error: (err) => {
        console.error('Payout failed', err);
        const errorMsg = err.error?.message || 'เกิดข้อผิดพลาดในการดำเนิน Payout';
        this.toast.error(errorMsg);
        this.isProcessingPayout = false;
        this.cdr.markForCheck();
      }
    });
  }

  getAssessorName(user: AssessorUser): string {
    if (user.user_profile) {
      return `${user.user_profile.first_name} ${user.user_profile.last_name}`;
    }
    return user.username || user.email;
  }

  getAssessorNameById(id: number | null | undefined): string {
    if (!id) return 'ยังไม่ได้มอบหมาย';
    const assessor = this.assessors.find(a => Number(a.id) === id);
    return assessor ? this.getAssessorName(assessor) : `Assessor ID: ${id}`;
  }

  getStripeAccountId(assessor: AssessorUser): string | null {
    const stripeAccount = assessor.bank_accounts?.find(b => b.account_no && b.account_no.startsWith('acct_'));
    return stripeAccount ? stripeAccount.account_no : null;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
      case 'SUBMITTED':
        return 'text-blue-700 bg-blue-50 ring-blue-600/20';
      case 'IN_REVIEW':
        return 'text-indigo-700 bg-indigo-50 ring-indigo-650/20';
      case 'REVISION_REQUESTED':
        return 'text-amber-800 bg-amber-50 ring-amber-600/20';
      case 'APPROVED':
        return 'text-emerald-700 bg-emerald-50 ring-emerald-600/20';
      case 'REJECTED':
        return 'text-rose-700 bg-rose-50 ring-rose-600/10';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  }

  getUnassignedAssessments() {
    return this.assessments.filter(a => !a.assessor_user_id && ['PENDING', 'SUBMITTED'].includes(a.status));
  }

  getAssignedAssessments() {
    return this.assessments.filter(a => a.assessor_user_id !== null && a.assessor_user_id !== undefined);
  }
}
