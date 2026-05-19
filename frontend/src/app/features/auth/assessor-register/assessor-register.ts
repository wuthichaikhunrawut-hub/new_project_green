import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UploadService } from '../../../core/services/upload.service';

@Component({
  selector: 'app-assessor-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessor-register.html',
  styleUrls: ['./assessor-register.css']
})
export class AssessorRegisterComponent {
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private router = inject(Router);

  step = 1;
  isLoading = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';

  userData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  };

  profileData = {
    license_number: '',
    years_experience: 0,
    education_background: '',
    expertise_tags: '',
    qualification_file_url: '',
    bank_name: '',
    bank_account_no: '',
    bank_account_name: ''
  };

  nextStep() {
    this.errorMessage = '';
    
    if (this.step === 1) {
      if (!this.userData.email || !this.userData.password || this.userData.password !== this.userData.confirmPassword) {
        this.errorMessage = 'กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง';
        return;
      }
    } else if (this.step === 2) {
      if (!this.userData.firstName || !this.userData.lastName || !this.userData.phone) {
        this.errorMessage = 'กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน';
        return;
      }
    } else if (this.step === 3) {
      if (!this.profileData.license_number || !this.profileData.qualification_file_url) {
        this.errorMessage = 'กรุณาระบุเลขใบอนุญาตและอัปโหลดไฟล์หลักฐาน';
        return;
      }
    }

    this.step++;
  }

  prevStep() {
    this.step--;
  }

  async onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];

    // Basic validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'รองรับเฉพาะไฟล์ PDF, JPG, PNG เท่านั้น';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.errorMessage = 'ไฟล์มีขนาดใหญ่เกินไป (จำกัด 5MB)';
      input.value = '';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('💎 Selected file:', file.name, file.type, file.size);

    // Add 30-second timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (this.isUploading) {
        this.isUploading = false;
        this.errorMessage = 'อัปโหลดหมดเวลา กรุณาลองใหม่อีกครั้ง';
        input.value = '';
      }
    }, 30000);

    this.uploadService.uploadFile(file, 'assessors').subscribe({
      next: (res) => {
        clearTimeout(timeoutId);
        this.profileData.qualification_file_url = res.url || res.file_url;
        this.isUploading = false;
        this.successMessage = 'อัปโหลดไฟล์หลักฐานเรียบร้อยแล้ว';
        console.log('✅ Upload success:', this.profileData.qualification_file_url);
      },
      error: (err) => {
        clearTimeout(timeoutId);
        console.error('❌ Upload failed', err);
        this.errorMessage = 'ไม่สามารถอัปโหลดไฟล์ได้: ' + (err.error?.message || err.message || 'Network Error — กรุณาตรวจสอบว่า Backend ทำงานอยู่');
        this.isUploading = false;
        input.value = ''; // Reset input so user can try again
      }
    });
  }

  async onRegister() {
    if (!this.profileData.bank_name || !this.profileData.bank_account_no) {
      this.errorMessage = 'กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response: any = await this.authService.registerAssessor({
        userData: {
          username: `${this.userData.firstName} ${this.userData.lastName}`,
          email: this.userData.email,
          password: this.userData.password
        },
        profileData: {
          ...this.profileData,
          firstName: this.userData.firstName,
          lastName: this.userData.lastName,
          phone: this.userData.phone
        }
      }).toPromise();

      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
    } finally {
      this.isLoading = false;
    }
  }
}
