import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-assessor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class AssessorProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private toast = inject(ToastService);


  user: any = null;
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  formData = {
    bio: '',
    assessor_profile: {
      license_number: '',
      expertise_tags: '',
      years_experience: 0,
      education_background: '',
      bank_name: '',
      bank_account_no: ''
    }
  };

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่';
      this.isLoading = false;
        this.cdr.detectChanges();
      return;
    }

    const userId = currentUser.id;

    this.http.get<any>('http://localhost:3001/users/profile/me', {
      headers: { 'x-user-id': userId.toString() }
    }).subscribe({
      next: (data) => {
        this.user = data || {
          username: currentUser.username || '',
          email: (currentUser as any).email || '',
          role: currentUser.role || 'ASSESSOR',
          assessor_verified: currentUser.assessor_verified || false
        };
        if (data) {
          this.formData.bio = data.bio || '';
          if (data.assessor_profile) {
            this.formData.assessor_profile = {
              license_number: data.assessor_profile.license_number || '',
              expertise_tags: data.assessor_profile.expertise_tags || '',
              years_experience: data.assessor_profile.years_experience || 0,
              education_background: data.assessor_profile.education_background || '',
              bank_name: data.assessor_profile.bank_name || '',
              bank_account_no: data.assessor_profile.bank_account_no || ''
            };
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.user = {
          username: currentUser.username || '',
          email: (currentUser as any).email || '',
          role: currentUser.role || 'ASSESSOR',
          assessor_verified: currentUser.assessor_verified || false
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile() {
    this.isSaving = true;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.id) return;

    this.http.patch<any>('http://localhost:3001/users/profile/me', this.formData, {
      headers: { 'x-user-id': currentUser.id.toString() }
    }).subscribe({
      next: () => {
        this.toast.success('อัปเดตข้อมูลสำเร็จ');
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        this.isSaving = false;
      }
    });
  }
}
