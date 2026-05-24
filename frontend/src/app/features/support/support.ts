import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
})
export class SupportComponent implements OnInit {
  private authService = inject(AuthService);
  isAdmin = false;
  
  mockTickets = [
    { id: 'TKT-001', subject: 'ปัญหาการเข้าสู่ระบบ', sender: 'user1@example.com', status: 'Pending', date: new Date().toISOString() },
    { id: 'TKT-002', subject: 'เสนอแนะฟีเจอร์เพิ่ม', sender: 'admin@org.com', status: 'In Progress', date: new Date().toISOString() }
  ];
  ticket = {
    subject: '',
    message: ''
  };
  
  selectedTicket: any = null;
  isSubmitting = false;
  submitted = false;

  viewTicket(ticket: any) {
    this.selectedTicket = ticket;
  }

  closeTicketModal() {
    this.selectedTicket = null;
  }

  updateTicketStatus(status: string) {
    if (this.selectedTicket) {
      this.selectedTicket.status = status;
      // In a real app, you would call an API here
    }
  }

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

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        const role = String(user.role).toUpperCase().trim().replace(' ', '_');
        if (role === 'SYSTEM_ADMIN' || role === 'ADMIN') {
          this.isAdmin = true;
        } else {
          this.isAdmin = false;
        }
      }
    });
  }
}
