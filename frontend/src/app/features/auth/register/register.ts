import { ToastService } from '../../../core/services/toast.service';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private toast = inject(ToastService);

  private router = inject(Router);
  private authService = inject(AuthService);

  // ข้อมูลสำหรับ Table organizations
  orgData = {
    name: '',
    tax_id: '',
    industry_type: '',
    number_of_employees: 0,
    total_floor_area: 0,
    working_hours_per_year: 0,
    base_year: new Date().getFullYear(),
    target_reduction_percent: 0,
    current_green_status: 'none'
  };

  // ข้อมูลสำหรับ Table users
  userData = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  acceptTerms: boolean = false;
  currentStep = 1;
  isLoading = false;

  nextStep() {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onRegister() {
    if (this.userData.password !== this.userData.confirmPassword) {
      this.toast.success('รหัสผ่านไม่ตรงกัน');
      return;
    }

    this.isLoading = true;
    
    const payload = {
      orgData: this.orgData,
      userData: {
        firstName: this.userData.firstName,
        lastName: this.userData.lastName,
        phone: this.userData.phone,
        email: this.userData.email,
        password: this.userData.password
      }
    };

    this.authService.register(payload).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;
        this.toast.success('ลงทะเบียนสำเร็จ! เข้าสู่ระบบอัตโนมัติ');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toast.error(err.error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    });
  }
}