import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestsService } from '../../../core/services/requests.service';

@Component({
  selector: 'app-assessor-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.html',
  styles: ``
})
export class AssessorNotificationsComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private requestsService = inject(RequestsService);

  activeTab: 'all' | 'unread' = 'all';
  notifications: any[] = [];

  get unreadCount() { return this.notifications.filter(n => !n.read).length; }

  get filteredNotifications() {
    return this.activeTab === 'unread'
      ? this.notifications.filter(n => !n.read)
      : this.notifications;
  }

  ngOnInit() { this.loadNotifications(); }

  loadNotifications() {
    this.requestsService.getRequests().subscribe({
      next: (requests) => {
        this.notifications = requests
          .filter(r => r.status === 'PENDING')
          .map(r => ({
            type: 'NEW_REQUEST',
            title: `คำขอใหม่จาก ${r.organization?.name || 'องค์กร'}`,
            message: `มีคำขอรับรอง Green Office ที่รอการตรวจประเมินจากคุณ`,
            time: r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('th-TH') : 'ไม่ทราบวันที่',
            requestId: r.id,
            read: false
          }));
        this.notifications.push({
          type: 'SYSTEM',
          title: 'ระบบอัปเดต',
          message: 'ระบบ GreenSync ได้รับการปรับปรุงประสิทธิภาพการทำงาน',
          time: 'วันนี้',
          requestId: null,
          read: false
        });
        this.cdr.markForCheck();
      },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
    this.cdr.markForCheck();
  }
}
