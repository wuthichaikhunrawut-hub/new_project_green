import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RequestsService } from '../../../core/services/requests.service';
import { AuthService } from '../../../core/services/auth.service';
import { Assessment } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-request.html'
})
export class CreateRequestComponent implements OnInit {
  private toast = inject(ToastService);

  private authService = inject(AuthService);
  private requestsService = inject(RequestsService);
  private router = inject(Router);

  isSubmitting = false;
  currentYear = new Date().getFullYear();
  yearOptions: number[] = [];

  user = this.authService.getUser();
  organizationName = this.user?.organizationName || 'องค์กรของคุณ';

  request: Partial<Assessment> = {
    status: 'PENDING',
    assessment_year: this.currentYear,
    notes: ''
  };

  ngOnInit() {
    // Generate year options (Current year, and next year)
    this.yearOptions = [this.currentYear - 1, this.currentYear, this.currentYear + 1];
  }

  onSubmit() {
    if (!this.request.assessment_year || !this.request.notes) {
      return;
    }

    this.isSubmitting = true;

    // Build the request object
    const newRequest: Partial<Assessment> = {
      status: 'PENDING',
      assessment_year: this.request.assessment_year,
      notes: this.request.notes
    };

    this.requestsService.createRequest(newRequest).subscribe({
      next: () => {
        this.toast.success('ส่งคำขอรับรองเรียบร้อยแล้ว!');
        this.isSubmitting = false;
        this.router.navigate(['/requests']);
      },
      error: (err: any) => {
        console.error('Failed to submit request', err);
        this.toast.error('เกิดข้อผิดพลาดในการส่งคำขอ');
        this.isSubmitting = false;
      }
    });
  }
}
