import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, Role } from '../../../core/services/users.service';
import { User } from '../../../core/models/user.model';
import { OrgService } from '../../../core/services/org.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private orgService = inject(OrgService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

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

  roles: Role[] = [];
  organizations: any[] = [];
  selectedOrgId: number | null = null;

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
      } else {
        this.selectedOrgId = null;
      }
    } else {
      // Setup empty user for creation
      this.selectedOrgId = this.isOrgAdmin ? this.currentOrgId : null;
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

    // Map org_id back to organization object or handled by backend
    if (this.selectedOrgId) {
      this.selectedUser.organization = { id: this.selectedOrgId };
    } else {
      this.selectedUser.organization = null;
    }

    if (this.selectedUser.id) {
      // Update existing
      this.usersService.updateUser(this.selectedUser.id, this.selectedUser).subscribe({
        next: () => {
          alert('บันทึกข้อมูลสำเร็จ');
          this.isSaving = false;
          this.closeEditModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Failed to update user:', err);
          alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err.error?.message || err.message));
          this.isSaving = false;
        }
      });
    } else {
      // Create new
      this.usersService.createUser(this.selectedUser).subscribe({
        next: () => {
          alert('เพิ่มผู้ใช้งานสำเร็จ');
          this.isSaving = false;
          this.closeEditModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Failed to create user:', err);
          alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน: ' + (err.error?.message || err.message));
          this.isSaving = false;
        }
      });
    }
  }


  suspendUser(user: User) {
    const action = user.is_active ? 'ระงับ' : 'เปิดใช้งาน';
    if (!confirm(`ยืนยันการ${action}บัญชีผู้ใช้นี้ใช่หรือไม่?`)) return;

    this.usersService.updateUser(user.id, { is_active: !user.is_active }).subscribe({
      next: () => {
        alert(`${action}บัญชีเรียบร้อยแล้ว`);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to toggle active status:', err);
        alert('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    });
  }

  deleteUser(user: User) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ "ลบ" บัญชีผู้ใช้นี้? (การกระทำนี้ไม่สามารถย้อนกลับได้)`)) return;

    // Ideally, call usersService.deleteUser(user.id), simulating it here if not implemented in service yet.
    // For now assuming the service has it or will have it:
    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        alert('ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to delete user:', err);
        alert('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
      }
    });
  }

  resetPassword(user: User) {
    const newPassword = prompt(`กรุณากรอกรหัสผ่านใหม่สำหรับ ${user.email} (ทิ้งว่างเพื่อยกเลิก):`);
    if (!newPassword || newPassword.trim() === '') return;

    this.usersService.updateUser(user.id, { password: newPassword }).subscribe({
      next: () => {
        alert('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว สำรองรหัสผ่านใหม่ให้ผู้ใช้งานด้วยครับ');
      },
      error: (err) => {
        console.error('Failed to reset password:', err);
        alert('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
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
      alert('ไม่มีข้อมูลให้ส่งออก');
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
