import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User } from '../../../core/services/users.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private cdr = inject(ChangeDetectorRef);

  users: User[] = [];
  isLoading = true;

  // For Edit Modal
  selectedUser: Partial<User> | null = null;
  isSaving = false;

  roles = ['USER', 'EXECUTIVE', 'ASSESSOR', 'ADMIN'];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(user?: User) {
    if (user) {
      this.selectedUser = { ...user };
    } else {
      // Setup empty user for creation
      this.selectedUser = {
        email: '',
        username: '',
        password: '',
        role: 'USER',
        is_active: true
      };
    }
  }

  closeEditModal() {
    this.selectedUser = null;
  }

  saveUser() {
    if (!this.selectedUser) return;
    this.isSaving = true;

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
          alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
          alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
          this.isSaving = false;
        }
      });
    }
  }

  searchText = '';

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
    const newPassword = prompt(`กรุณากรอกรหัสผ่านใหม่สำหรับ ${user.username} (ทิ้งว่างเพื่อยกเลิก):`);
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

  filteredUsers(): User[] {
    if (!this.searchText) {
      return this.users;
    }
    const lowerSearch = this.searchText.toLowerCase();
    return this.users.filter(u => 
      u.username.toLowerCase().includes(lowerSearch) ||
      u.email.toLowerCase().includes(lowerSearch) ||
      (u.organization?.name && u.organization.name.toLowerCase().includes(lowerSearch))
    );
  }
}
