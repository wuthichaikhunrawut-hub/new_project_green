import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, NotificationType } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
})
export class SupportComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  isAdmin = false;
  tickets: any[] = [];
  currentUserEmail = '';
  
  // Native Angular Accordion State
  activeFaq: number | null = null;

  toggleFaq(index: number) {
    if (this.activeFaq === index) {
      this.activeFaq = null;
    } else {
      this.activeFaq = index;
    }
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  
  ticket = {
    subject: '',
    message: ''
  };
  
  selectedTicket: any = null;
  isSubmitting = false;
  submitted = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserEmail = user.email || '';
        const role = String(user.role).toUpperCase().trim().replace(' ', '_');
        if (role === 'SYSTEM_ADMIN' || role === 'ADMIN') {
          this.isAdmin = true;
          setTimeout(() => {
            this.loadTicketsForAdmin();
          }, 0);
        } else {
          this.isAdmin = false;
        }
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  loadTicketsForAdmin() {
    this.notificationService.getAllSystemNotifications().subscribe({
      next: (notifications) => {
        // Filter system notifications that are support tickets
        const mappedTickets = (notifications || [])
          .filter(n => n && n.title && n.title.startsWith('[ตั๋วความช่วยเหลือ]'))
          .map(n => {
            let status = 'Pending';
            if (n.is_read) {
              status = 'Resolved';
            }
            // Parse subject and sender safely
            const subject = n.title ? n.title.replace('[ตั๋วความช่วยเหลือ] - ', '') : 'ตั๋วความช่วยเหลือ';
            
            return {
              id: `TKT-${String(n.id).padStart(3, '0')}`,
              subject: subject,
              sender: (n as any).sender?.email || 'ไม่ระบุอีเมล',
              status: status,
              date: n.created_at,
              message: n.message ? n.message.replace('รายละเอียด: ', '') : '',
              rawId: n.id
            };
          });

        setTimeout(() => {
          this.tickets = mappedTickets;
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Error loading support tickets:', err);
        this.toast.error('ไม่สามารถดึงข้อมูลตั๋วแจ้งปัญหาได้ กรุณาลองใหม่อีกครั้ง');
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  viewTicket(ticket: any) {
    this.selectedTicket = ticket;
  }

  closeTicketModal() {
    this.selectedTicket = null;
  }

  updateTicketStatus(status: string) {
    if (this.selectedTicket && this.selectedTicket.rawId) {
      if (status === 'Resolved') {
        this.notificationService.markAsRead(this.selectedTicket.rawId).subscribe({
          next: () => {
            setTimeout(() => {
              this.selectedTicket.status = status;
              this.loadTicketsForAdmin();
              this.cdr.detectChanges();
            }, 0);
          },
          error: (err) => {
            console.error('Error updating ticket status:', err);
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 0);
          }
        });
      } else {
        // If pending/in progress, keep as pending
        setTimeout(() => {
          this.selectedTicket.status = status;
          this.cdr.detectChanges();
        }, 0);
      }
    }
  }

  onSubmit() {
    if (!this.ticket.subject || !this.ticket.message) {
      this.toast.error('กรุณากรอกหัวข้อและรายละเอียดปัญหา');
      return;
    }

    this.isSubmitting = true;

    // Map subject value to clean text
    const subjectMap: Record<string, string> = {
      technical: 'ปัญหาการใช้งานระบบ (Technical Issue)',
      billing: 'ปัญหาการชำระเงิน (Billing/Invoice)',
      feature: 'เสนอแนะฟีเจอร์ใหม่ (Feature Request)',
      other: 'อื่นๆ (Other)'
    };
    const cleanSubject = subjectMap[this.ticket.subject] || this.ticket.subject;

    // We pass recipient_id: 1 directly (the primary System Admin).
    // This satisfies database foreign key constraints instantly and bypasses 
    // any heavy sequential query bottlenecks in the backend.
    this.submitTicket(cleanSubject, 1);
  }

  private submitTicket(cleanSubject: string, recipientId: number) {
    this.notificationService.sendNotification({
      title: `[ตั๋วความช่วยเหลือ] - ${cleanSubject}`,
      message: `รายละเอียด: ${this.ticket.message}`,
      type: NotificationType.SYSTEM,
      recipient_id: recipientId,
      link: '/support'
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.isSubmitting = false;
          this.submitted = true;
          this.toast.success('ส่งตั๋วแจ้งปัญหาสำเร็จ!');
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Error submitting support ticket:', err);
        setTimeout(() => {
          this.isSubmitting = false;
          this.toast.error('ไม่สามารถส่งตั๋วได้ กรุณาลองใหม่อีกครั้ง');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  resetForm() {
    this.submitted = false;
    this.ticket = { subject: '', message: '' };
    this.cdr.detectChanges();
  }
}
