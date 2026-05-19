import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'all' | 'unread' = 'all';
  notifications: Notification[] = [];
  isLoading = false;

  get unreadCount() { 
    return this.notifications.filter(n => !n.is_read).length; 
  }

  get filteredNotifications() {
    return this.activeTab === 'unread'
      ? this.notifications.filter(n => !n.is_read)
      : this.notifications;
  }

  ngOnInit() { 
    this.loadNotifications(); 
  }

  loadNotifications() {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  markAsRead(n: Notification) {
    if (n.is_read) return;
    this.notificationService.markAsRead(n.id).subscribe(() => {
      n.is_read = true;
      this.cdr.markForCheck();
    });
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.is_read = true);
      this.cdr.markForCheck();
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'DEADLINE': return 'fa-clock';
      case 'ASSESSMENT': return 'fa-file-circle-check';
      case 'ACCOUNT': return 'fa-user-shield';
      default: return 'fa-circle-info';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'DEADLINE': return 'text-warning';
      case 'ASSESSMENT': return 'text-primary';
      case 'ACCOUNT': return 'text-success';
      default: return 'text-info';
    }
  }
}
