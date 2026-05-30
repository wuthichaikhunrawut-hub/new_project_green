import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../../core/services/auth.service';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  // Forgot Password Modal State
  showForgotModal = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotSuccess = false;
  forgotError = '';

  forgotPassword() {
    this.showForgotModal = true;
    this.forgotEmail = this.username; // pre-fill from login form
    this.forgotSuccess = false;
    this.forgotError = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
    this.forgotEmail = '';
    this.forgotError = '';
    this.forgotSuccess = false;
    this.forgotLoading = false;
  }

  submitForgotPassword() {
    if (!this.forgotEmail.trim()) {
      this.forgotError = 'กรุณากรอกอีเมลของคุณ';
      return;
    }
    this.forgotLoading = true;
    this.forgotError = '';
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotSuccess = true;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        this.cdr.markForCheck();
      }
    });
  }

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const credentials = {
      email: this.username,
      password: this.password
    };

    this.authService.login(credentials).pipe(timeout(15000)).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        try {
          if (response && response.access_token) {
            const role = response.user.role || '';

            // Normalize role check
            const roleUpper = role.toUpperCase().trim().split(' ').join('_');
            const isExecutive = roleUpper === 'EXECUTIVE';
            const isAdmin = roleUpper === 'ADMIN'
              || roleUpper === 'SYSTEM_ADMIN';

            const isAssessor = roleUpper === 'ASSESSOR';

            if (isAssessor) {
              this.router.navigate(['/assessor/dashboard']);
            } else if (isExecutive) {
              this.router.navigate(['/executive/dashboard']);
            } else if (roleUpper === 'ORGANIZATION_ADMIN' || roleUpper === 'ORG_ADMIN') {
              this.router.navigate(['/dashboard']);
            } else if (isAdmin) {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          } else {
            this.errorMessage = 'การตอบรับจากเซิร์ฟเวอร์ไม่สมบูรณ์';
            this.cdr.markForCheck();
          }
        } catch (e) {
          console.error('Login processing error:', e);
          this.errorMessage = 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล';
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Login error:', err);
        if (err.name === 'TimeoutError') {
          this.errorMessage = 'เซิร์ฟเวอร์ตอบสนองช้าเกินไป กรุณาลองใหม่อีกครั้ง';
        } else if (err.status === 401) {
          this.errorMessage = 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
        } else if (err.status === 0) {
          this.errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
        } else {
          this.errorMessage = 'เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่ภายหลัง';
        }
        this.cdr.markForCheck();
      }
    });
  }
}