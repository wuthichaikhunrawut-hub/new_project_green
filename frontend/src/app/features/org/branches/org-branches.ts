import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgBranchesService, OrgBranch } from '../../../core/services/org-branches.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-org-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './org-branches.html'
})
export class OrgBranchesComponent implements OnInit {
  branches: OrgBranch[] = [];
  isLoading = false;
  orgId: number;

  newBranchName = '';

  constructor(
    private branchService: OrgBranchesService,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.orgId = this.authService.getOrganizationId() || 0;
  }

  ngOnInit() {
    if (this.orgId) {
      this.loadBranches();
    }
  }

  loadBranches() {
    this.isLoading = true;
    this.branchService.getBranches(this.orgId).subscribe({
      next: (res) => {
        this.branches = res;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('ไม่สามารถโหลดข้อมูลสาขาได้');
        this.isLoading = false;
      }
    });
  }

  addBranch() {
    if (!this.newBranchName.trim()) return;
    this.branchService.createBranch(this.orgId, { unit_name: this.newBranchName }).subscribe({
      next: () => {
        this.toast.success('เพิ่มสาขาสำเร็จ');
        this.newBranchName = '';
        this.loadBranches();
      },
      error: () => this.toast.error('ไม่สามารถเพิ่มสาขาได้')
    });
  }

  deleteBranch(id: number) {
    if (!confirm('ยืนยันการลบสาขานี้? ระบบจะไม่ลบข้อมูลการปล่อยคาร์บอน แต่แค่ยกเลิกการผูกกับสาขานี้')) return;
    this.branchService.deleteBranch(id).subscribe({
      next: () => {
        this.toast.success('ลบสาขาสำเร็จ');
        this.loadBranches();
      },
      error: () => this.toast.error('ไม่สามารถลบสาขาได้ (อาจมีข้อมูลอ้างอิงอยู่)')
    });
  }
}
