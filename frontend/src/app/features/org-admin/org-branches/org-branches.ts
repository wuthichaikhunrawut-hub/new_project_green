import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { OrgBranchesService, OrgBranch } from '../../../core/services/org-branches.service';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog';

@Component({
  selector: 'app-org-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './org-branches.html',
  styleUrls: ['./org-branches.css']
})
export class OrgBranchesComponent implements OnInit {
  private toast = inject(ToastService);

  private branchesService = inject(OrgBranchesService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  branches: OrgBranch[] = [];
  
  showDeleteConfirm = false;
  branchToDelete: number | null = null;
  employees: User[] = [];
  
  branchEmployeesMap = new Map<number, User[]>();
  unassignedEmployees: User[] = [];
  
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
        
        // Auto-create "หน่วยงานกลาง" if at least one branch exists but "หน่วยงานกลาง" doesn't
        if (this.branches.length > 0) {
          const hasCentral = this.branches.some(b => b.unit_name === 'หน่วยงานกลาง');
          if (!hasCentral) {
            const centralBranch: Partial<OrgBranch> = {
              unit_name: 'หน่วยงานกลาง',
              unit_type: 'Branch',
              area: 120, // default area
              org_id: this.orgId!
            };
            this.branchesService.createBranch(this.orgId!, centralBranch).subscribe({
              next: () => {
                this.loadData();
              },
              error: (err) => {
                console.error('Failed to auto-create หน่วยงานกลาง branch', err);
                this.loadEmployees();
              }
            });
            return;
          }
        }
        
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
        this.employees = users.filter(u => {
          const r = String(u.role || '').trim().toUpperCase();
          return !['SYSTEM_ADMIN', 'ADMIN', 'ASSESSOR'].includes(r);
        });
        this.mapEmployees();
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

  mapEmployees() {
    this.branchEmployeesMap.clear();
    this.branches.forEach(b => {
      if (b.id != null) {
        this.branchEmployeesMap.set(b.id, []);
      }
    });
    
    this.unassignedEmployees = [];
    
    let mainBranch = this.branches.find(b => b.unit_name === 'หน่วยงานกลาง');
    if (!mainBranch) {
      mainBranch = this.branches.find(b => b.unit_name === 'สาขาหลัก' || b.unit_name.includes('หลัก'));
    }
    if (!mainBranch && this.branches.length > 0) {
      mainBranch = this.branches[0];
    }
    
    const pendingAssignments: { empId: number; branchId: number }[] = [];
    
    this.employees.forEach(emp => {
      const currentBranchId = emp.org_unit_id || emp.organization_unit?.id;
      if (currentBranchId) {
        if (!this.branchEmployeesMap.has(currentBranchId)) {
          this.branchEmployeesMap.set(currentBranchId, []);
        }
        this.branchEmployeesMap.get(currentBranchId)!.push(emp);
      } else {
        if (mainBranch && mainBranch.id != null) {
          emp.org_unit_id = mainBranch.id;
          if (emp.organization_unit) {
            emp.organization_unit.id = mainBranch.id;
          } else {
            emp.organization_unit = { id: mainBranch.id } as any;
          }
          if (!this.branchEmployeesMap.has(mainBranch.id)) {
            this.branchEmployeesMap.set(mainBranch.id, []);
          }
          this.branchEmployeesMap.get(mainBranch.id)!.push(emp);
          pendingAssignments.push({ empId: emp.id, branchId: mainBranch.id });
        } else {
          this.unassignedEmployees.push(emp);
        }
      }
    });
    
    // Batch auto-assign: fire all requests via forkJoin instead of unbatched loop
    if (pendingAssignments.length > 0) {
      const requests = pendingAssignments.map(a =>
        this.usersService.updateUser(a.empId, { org_unit_id: a.branchId } as Partial<User>)
      );
      forkJoin(requests).subscribe({
        next: () => this.toast.success(`จัดสังกัดอัตโนมัติ ${pendingAssignments.length} คน สำเร็จ`),
        error: (err) => {
          console.error('Failed to auto-assign employees to central branch', err);
          this.toast.error('จัดสังกัดอัตโนมัติบางส่วนล้มเหลว');
        }
      });
    }
  }

  private emptyArray: User[] = [];

  getEmployeesInBranch(branchId: number): User[] {
    return this.branchEmployeesMap.get(branchId) || this.emptyArray;
  }

  getUnassignedEmployees(): User[] {
    return this.unassignedEmployees;
  }

  openModal(branch?: OrgBranch) {
    if (branch) {
      this.editingBranch = { ...branch };
    } else {
      this.editingBranch = { unit_name: '', unit_type: 'Branch', area: undefined, org_id: this.orgId! };
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
          this.toast.error('เกิดข้อผิดพลาดในการบันทึกสาขา');
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
          this.toast.error('เกิดข้อผิดพลาดในการสร้างสาขา');
          this.isSaving = false;
        }
      });
    }
  }

  deleteBranch(id: number) {
    this.branchToDelete = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (this.branchToDelete) {
      this.branchesService.deleteBranch(this.branchToDelete).subscribe({
        next: () => {
          this.toast.success('ลบสาขาสำเร็จ');
          this.loadData();
          this.cancelDelete();
        },
        error: (err) => {
          console.error('Failed to delete branch', err);
          this.toast.error('ไม่สามารถลบสาขาได้ กรุณาลองใหม่อีกครั้ง');
          this.cancelDelete();
        }
      });
    }
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.branchToDelete = null;
  }

  assignEmployee(userId: number, branchId: number | null) {
    this.usersService.updateUser(userId, { org_unit_id: branchId ?? null } as Partial<User>).subscribe({
      next: () => {
        // Update local state directly to avoid full reload
        const emp = this.employees.find(e => e.id === userId);
        if (emp) {
          emp.org_unit_id = branchId ?? undefined;
          if (branchId === null) {
            emp.organization_unit = undefined;
          } else if (emp.organization_unit) {
            emp.organization_unit.id = branchId;
          } else {
            emp.organization_unit = { id: branchId } as any;
          }
        }
        this.mapEmployees();
        this.cdr.markForCheck();
      },
      error: () => this.toast.error('ไม่สามารถอัปเดตสังกัดของพนักงานได้')
    });
  }
}
