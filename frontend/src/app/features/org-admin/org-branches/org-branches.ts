import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgBranchesService, OrgBranch } from '../../../core/services/org-branches.service';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-org-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './org-branches.html',
  styleUrls: ['./org-branches.css']
})
export class OrgBranchesComponent implements OnInit {
  private branchesService = inject(OrgBranchesService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  branches: OrgBranch[] = [];
  employees: User[] = [];
  
  isLoading = true;
  isSaving = false;
  
  showModal = false;
  editingBranch: Partial<OrgBranch> | null = null;
  orgId: number | null = null;

  ngOnInit(): void {
    this.orgId = this.authService.getOrganizationId();
    if (this.orgId) {
      this.loadData();
    } else {
      this.isLoading = false;
    }
  }

  loadData() {
    this.isLoading = true;
    this.branchesService.getBranches(this.orgId!).subscribe({
      next: (branches) => {
        this.branches = branches;
        this.loadEmployees(); // Load employees after branches
      },
      error: (err) => {
        console.error('Failed to load branches', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadEmployees() {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.employees = users.filter(u => u.role === 'Employee' || u.role === 'User' || u.role === 'EMPLOYEE' || u.role === 'USER');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getEmployeesInBranch(branchId: number): User[] {
    return this.employees.filter(e => e.org_unit_id === branchId);
  }

  getUnassignedEmployees(): User[] {
    return this.employees.filter(e => !e.org_unit_id);
  }

  openModal(branch?: OrgBranch) {
    if (branch) {
      this.editingBranch = { ...branch };
    } else {
      this.editingBranch = { unit_name: '', unit_type: 'Branch', org_id: this.orgId! };
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingBranch = null;
  }

  saveBranch() {
    if (!this.editingBranch || !this.editingBranch.unit_name) return;
    this.isSaving = true;

    if (this.editingBranch.id) {
      this.branchesService.updateBranch(this.editingBranch.id, this.editingBranch).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
          this.isSaving = false;
        },
        error: () => {
          alert('เกิดข้อผิดพลาดในการบันทึกสาขา');
          this.isSaving = false;
        }
      });
    } else {
      this.branchesService.createBranch(this.orgId!, this.editingBranch).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
          this.isSaving = false;
        },
        error: () => {
          alert('เกิดข้อผิดพลาดในการสร้างสาขา');
          this.isSaving = false;
        }
      });
    }
  }

  deleteBranch(id: number) {
    if (confirm('ยืนยันการลบสาขานี้? พนักงานในสาขานี้จะถูกยกเลิกการผูกมัดสาขาทันที')) {
      this.branchesService.deleteBranch(id).subscribe({
        next: () => {
          this.loadData();
        }
      });
    }
  }

  assignEmployee(userId: number, branchId: number | null) {
    this.usersService.updateUser(userId, { org_unit_id: branchId ?? null } as Partial<User>).subscribe({
      next: () => {
        // Update local state directly to avoid full reload
        const emp = this.employees.find(e => e.id === userId);
        if (emp) {
          emp.org_unit_id = branchId ?? undefined;
        }
        this.cdr.markForCheck();
      },
      error: () => alert('ไม่สามารถอัปเดตสังกัดของพนักงานได้')
    });
  }
}
