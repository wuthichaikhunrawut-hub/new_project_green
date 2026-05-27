import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, Role } from '../../../core/services/users.service';
import { User } from '../../../core/models/user.model';
import { OrgService } from '../../../core/services/org.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrgBranchesService, OrgBranch } from '../../../core/services/org-branches.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class AdminUsersComponent implements OnInit {
  private toast = inject(ToastService);

  private usersService = inject(UsersService);
  private orgService = inject(OrgService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private branchService = inject(OrgBranchesService);

  isSystemAdmin = false;
  isOrgAdmin = false;
  currentOrgId: number | null = null;

  users: User[] = [];
  isLoading = true;
  activeTab: 'ALL' | 'ADMIN' | 'ASSESSOR' | 'ADMIN_ORG' | 'MEMBER' = 'ALL';
  searchText: string = '';

  get countByRole() {
    return {
      all: this.users.length,
      admin: this.users.filter(u => ['System Admin', 'SYSTEM_ADMIN', 'ADMIN'].includes(String(u.role).trim())).length,
      assessor: this.users.filter(u => ['Assessor', 'ASSESSOR'].includes(String(u.role).trim())).length,
      adminOrg: this.users.filter(u => ['Organization Admin', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].includes(String(u.role).trim())).length,
      member: this.users.filter(u => !['System Admin', 'SYSTEM_ADMIN', 'ADMIN', 'Assessor', 'ASSESSOR', 'Organization Admin', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].includes(String(u.role).trim())).length
    };
  }

  // For Edit Modal
  selectedUser: Partial<User> | null = null;
  isSaving = false;

  // For Confirm Modals
  userToSuspend: User | null = null;
  userToDelete: User | null = null;
  userToResetPass: User | null = null;
  newPasswordInput: string = '';

  roles: Role[] = [];
  organizations: any[] = [];
  selectedOrgId: number | null = null;
  branches: OrgBranch[] = [];
  selectedBranchId: number | null = null;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.checkRoles();
        this.loadUsers();
        this.loadRoles();
        if (this.isSystemAdmin) {
          this.loadOrganizations();
        }
      }
    });
  }

  checkRoles() {
    const user = this.authService.getUser();
    const role = (user?.role || '').toUpperCase().trim().split(' ').join('_');
    
    // Exact match to prevent Organization Admin from being identified as System Admin
    this.isSystemAdmin = role === 'SYSTEM_ADMIN' || role === 'ADMIN';
    this.isOrgAdmin = role === 'ORGANIZATION_ADMIN' || role === 'ORG_ADMIN';
    
    this.currentOrgId = this.authService.getOrganizationId();
  }

  loadOrganizations() {
    this.orgService.getAll().subscribe({
      next: (data) => {
        this.organizations = data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load organizations:', err)
    });
  }

  loadBranches(orgId: number) {
    this.branchService.getBranches(orgId).subscribe({
      next: (data) => {
        this.branches = data;
        if (!this.selectedBranchId && this.branches.length > 0) {
          const central = this.branches.find(b => b.unit_name === 'หน่วยงานกลาง') || this.branches[0];
          if (central) {
            this.selectedBranchId = central.id!;
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load branches:', err)
    });
  }

  onOrgChange() {
    this.selectedBranchId = null;
    if (this.selectedOrgId) {
      this.loadBranches(this.selectedOrgId);
    } else {
      this.branches = [];
    }
  }

  loadRoles() {
    this.usersService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
      }
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openEditModal(user?: User) {
    if (user) {
      this.selectedUser = { ...user };
      if (!this.selectedUser.user_profile) {
        this.selectedUser.user_profile = { first_name: '', last_name: '', phone: '' };
      }
      // Set org id for dropdown
      if (this.selectedUser.organization) {
        this.selectedOrgId = this.selectedUser.organization.id;
        this.onOrgChange();
      } else {
        this.selectedOrgId = null;
        this.branches = [];
      }
      this.selectedBranchId = this.selectedUser.org_unit_id || null;
    } else {
      // Setup empty user for creation
      this.selectedOrgId = this.isOrgAdmin ? this.currentOrgId : null;
      if (this.selectedOrgId) {
        this.onOrgChange();
      } else {
        this.branches = [];
      }
      this.selectedBranchId = null;
      this.selectedUser = {
        email: '',
        password: '',
        role: 'USER',
        is_active: true,
        user_profile: { first_name: '', last_name: '', phone: '' }
      };
    }
  }

  closeEditModal() {
    this.selectedUser = null;
  }

  saveUser() {
    if (!this.selectedUser) return;
    this.isSaving = true;

    const payload: any = {
      email: this.selectedUser.email,
      role: this.selectedUser.role,
      is_active: this.selectedUser.is_active
    };

    if (this.selectedUser.user_profile) {
      payload.user_profile = { ...this.selectedUser.user_profile };
      delete payload.user_profile.userId;
      delete payload.user_profile.created_at;
      delete payload.user_profile.updated_at;
      delete payload.user_profile.id;
    }

    if (this.selectedUser.password) {
      payload.password = this.selectedUser.password;
    }

    if (this.selectedOrgId) {
      payload.organization = { id: Number(this.selectedOrgId) };
    }

    if (!this.selectedBranchId && this.branches.length > 0) {
      const central = this.branches.find(b => b.unit_name === 'หน่วยงานกลาง') || this.branches[0];
      if (central) {
        this.selectedBranchId = central.id!;
      }
    }

    if (this.selectedBranchId) {
      payload.org_unit_id = Number(this.selectedBranchId);
    }

    if (this.selectedUser.id) {
      // Update existing
      this.usersService.updateUser(this.selectedUser.id, payload).subscribe({
        next: () => {
          this.toast.success('บันทึกข้อมูลสำเร็จ');
          this.isSaving = false;
          this.closeEditModal();
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update user:', err);
          this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err.error?.message || err.message));
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new
      this.usersService.createUser(payload).subscribe({
        next: () => {
          this.toast.success('เพิ่มผู้ใช้งานสำเร็จ');
          this.isSaving = false;
          this.closeEditModal();
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to create user:', err);
          this.toast.error('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน: ' + (err.error?.message || err.message));
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }


  suspendUser(user: User) {
    this.userToSuspend = user;
  }

  confirmSuspend() {
    if (!this.userToSuspend) return;
    const user = this.userToSuspend;
    const action = user.is_active ? 'ระงับ' : 'เปิดใช้งาน';
    this.isSaving = true;

    this.usersService.updateUser(user.id, { is_active: !user.is_active }).subscribe({
      next: () => {
        this.toast.success(`${action}บัญชีเรียบร้อยแล้ว`);
        this.userToSuspend = null;
        this.isSaving = false;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to toggle active status:', err);
        this.toast.error('เกิดข้อผิดพลาดในการดำเนินการ');
        this.isSaving = false;
      }
    });
  }

  deleteUser(user: User) {
    this.userToDelete = user;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    this.isSaving = true;
    this.usersService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.toast.success('ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว');
        this.userToDelete = null;
        this.isSaving = false;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to delete user:', err);
        this.toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
        this.isSaving = false;
      }
    });
  }

  resetPassword(user: User) {
    this.userToResetPass = user;
    this.newPasswordInput = '';
  }

  confirmResetPassword() {
    if (!this.userToResetPass || !this.newPasswordInput.trim()) return;
    this.isSaving = true;

    this.usersService.updateUser(this.userToResetPass.id, { password: this.newPasswordInput }).subscribe({
      next: () => {
        this.toast.success('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว สำรองรหัสผ่านใหม่ให้ผู้ใช้งานด้วยครับ');
        this.userToResetPass = null;
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Failed to reset password:', err);
        this.toast.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
        this.isSaving = false;
      }
    });
  }

  setTab(tab: 'ALL' | 'ADMIN' | 'ASSESSOR' | 'ADMIN_ORG' | 'MEMBER') {
    this.activeTab = tab;
  }

  filteredUsers(): User[] {
    // First apply tab filter
    let filtered = this.users;
    
    if (this.activeTab === 'ADMIN') {
      filtered = filtered.filter(u => ['System Admin', 'SYSTEM_ADMIN', 'ADMIN'].includes(String(u.role).trim()));
    } else if (this.activeTab === 'ASSESSOR') {
      filtered = filtered.filter(u => ['Assessor', 'ASSESSOR'].includes(String(u.role).trim()));
    } else if (this.activeTab === 'ADMIN_ORG') {
      filtered = filtered.filter(u => ['Organization Admin', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].includes(String(u.role).trim()));
    } else if (this.activeTab === 'MEMBER') {
      filtered = filtered.filter(u => !['System Admin', 'SYSTEM_ADMIN', 'ADMIN', 'Assessor', 'ASSESSOR', 'Organization Admin', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].includes(String(u.role).trim()));
    }

    // Then apply text filter
    if (!this.searchText) {
      return filtered;
    }
    
    const lowerSearch = this.searchText.toLowerCase();
    return filtered.filter(u => 
      (u.email && u.email.toLowerCase().includes(lowerSearch)) ||
      (u.organization?.name && u.organization.name.toLowerCase().includes(lowerSearch)) ||
      (u.user_profile?.first_name && u.user_profile.first_name.toLowerCase().includes(lowerSearch)) ||
      (u.user_profile?.last_name && u.user_profile.last_name.toLowerCase().includes(lowerSearch))
    );
  }

  exportToCSV() {
    const dataToExport = this.filteredUsers();
    if (dataToExport.length === 0) {
      this.toast.warning('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    const headers = ['Email', 'Created At', 'Organization', 'Role', 'Status'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const user of dataToExport) {
      const row = [
        `"${user.email}"`,
        `"${user.created_at}"`,
        `"${user.organization?.name || '-'}"`,
        `"${user.role}"`,
        `"${user.is_active ? 'Active' : 'Suspended'}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getStatusBadgeClass(active: boolean): string {
    return 'status-badge ' + (active ? 'status-approved' : 'status-rejected');
  }

  getStatusLabel(active: boolean): string {
    return active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน';
  }
}
