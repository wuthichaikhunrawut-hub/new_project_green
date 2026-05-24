import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessorsAdminService, AssessorUser } from '../../../core/services/assessors-admin.service';

@Component({
  selector: 'app-admin-assessors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assessors.html',
  styleUrls: ['./assessors.css']
})
export class AdminAssessorsComponent implements OnInit {
  private toast = inject(ToastService);

  private svc = inject(AssessorsAdminService);
  private cdr = inject(ChangeDetectorRef);

  assessors: AssessorUser[] = [];
  filteredData: AssessorUser[] = [];
  isLoading = true;
  searchText = '';
  filterStatus = 'ALL';

  // For Confirm Modals
  assessorToVerify: AssessorUser | null = null;
  verifyActionTargetState: boolean = false;
  assessorToSuspend: AssessorUser | null = null;

  ngOnInit() { this.loadAssessors(); }

  loadAssessors() {
    this.isLoading = true;
    this.svc.getAssessors().subscribe({
      next: (data) => { 
        this.assessors = data; 
        this.isLoading = false; 
        this.applyFilters();
      },
      error: () => { 
        this.isLoading = false; 
        this.cdr.markForCheck(); 
      }
    });
  }

  applyFilters() {
    let result = this.assessors;
    
    if (this.filterStatus === 'APPROVED') {
      result = result.filter(a => a.assessor_verified);
    } else if (this.filterStatus === 'PENDING') {
      result = result.filter(a => !a.assessor_verified && a.is_active);
    } else if (this.filterStatus === 'SUSPENDED') {
      result = result.filter(a => !a.is_active);
    }

    if (this.searchText) {
      const lowerSearch = this.searchText.toLowerCase();
      result = result.filter(a => 
        (a.username && a.username.toLowerCase().includes(lowerSearch)) ||
        (a.email && a.email.toLowerCase().includes(lowerSearch))
      );
    }
    
    this.filteredData = result;
    this.cdr.markForCheck();
  }

  verify(user: AssessorUser) {
    this.assessorToVerify = user;
    this.verifyActionTargetState = !user.assessor_verified;
  }

  confirmVerify() {
    if (!this.assessorToVerify) return;
    this.svc.verifyAssessor(this.assessorToVerify.id, this.verifyActionTargetState).subscribe({
      next: () => {
        this.toast.success(`ดำเนินการเรียบร้อยแล้ว`);
        this.assessorToVerify = null;
        this.loadAssessors();
      },
      error: () => {
        this.toast.error(`เกิดข้อผิดพลาด ไม่สามารถดำเนินการได้`);
      }
    });
  }

  suspend(user: AssessorUser) {
    this.assessorToSuspend = user;
  }

  confirmSuspend() {
    if (!this.assessorToSuspend) return;
    const action = this.assessorToSuspend.is_active ? 'ระงับ' : 'เปิดใช้งาน';
    
    this.svc.suspendAssessor(this.assessorToSuspend.id, !this.assessorToSuspend.is_active).subscribe({
      next: () => {
        this.toast.success(`${action}บัญชี ${this.assessorToSuspend!.username} เรียบร้อยแล้ว`);
        this.assessorToSuspend = null;
        this.loadAssessors();
      },
      error: () => {
        this.toast.error(`เกิดข้อผิดพลาด ไม่สามารถ${action}ได้`);
      }
    });
  }

  // Modal logic
  selectedAssessor: AssessorUser | null = null;

  openModal(user: AssessorUser) {
    this.selectedAssessor = user;
  }

  closeModal() {
    this.selectedAssessor = null;
  }

  verifyFromModal(verified: boolean) {
    if (!this.selectedAssessor) return;
    this.assessorToVerify = this.selectedAssessor;
    this.verifyActionTargetState = verified;
    this.closeModal(); // Close details modal and open confirm modal
  }
}
