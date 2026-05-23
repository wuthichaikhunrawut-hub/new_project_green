import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
})
export class SupportComponent {
  ticket = {
    subject: '',
    message: ''
  };
  
  isSubmitting = false;
  submitted = false;

  onSubmit() {
    this.isSubmitting = true;
    
    // จำลองการส่งข้อมูล (ในระบบจริงควรเรียก API)
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitted = true;
      this.ticket = { subject: '', message: '' };
      
      // ให้ข้อความ success หายไปหลังจาก 5 วินาที
      setTimeout(() => {
        this.submitted = false;
      }, 5000);
    }, 1500);
  }
}
