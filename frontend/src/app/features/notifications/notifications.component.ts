import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { ToastService } from '../../shared/services/toast.service';

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
  private router = inject(Router);
  private toast = inject(ToastService);

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

  viewDetails(n: Notification) {
    this.markAsRead(n);
    if (n.link) {
      this.navigateSafely(n.link);
    }
  }

  navigateSafely(link: string) {
    if (!link) return;
    let targetLink = link.trim();
    if (!targetLink.startsWith('/') && !targetLink.startsWith('http')) {
      targetLink = '/' + targetLink;
    }
    
    if (!this.isRouteValid(targetLink)) {
      this.toast.warning('ไม่พบหน้ารายละเอียดดังกล่าวในระบบ หรือลิงก์ไม่ถูกต้อง');
      return;
    }
    
    this.router.navigateByUrl(targetLink);
  }

  isRouteValid(link: string): boolean {
    if (!link) return false;
    const cleanLink = link.split('?')[0].split('#')[0];
    const path = cleanLink.startsWith('/') ? cleanLink.slice(1) : cleanLink;
    
    const patterns = [
      /^dashboard$/,
      /^admin\/dashboard$/,
      /^admin\/users$/,
      /^admin\/criteria$/,
      /^admin\/organizations$/,
      /^admin\/emission-factors$/,
      /^admin\/assessors$/,
      /^admin\/settings$/,
      /^admin\/subscriptions$/,
      /^admin\/invoices$/,
      /^admin\/audit-logs$/,
      /^admin\/notifications$/,
      /^assessor\/dashboard$/,
      /^assessor\/assignments$/,
      /^assessor\/evidence\/\d+$/,
      /^assessor\/decide\/\d+$/,
      /^assessor\/history$/,
      /^assessor\/report\/\d+$/,
      /^assessor\/notifications$/,
      /^carbon\/logs$/,
      /^ai-scan$/,
      /^assessment$/,
      /^assessment\/category\/\d+$/,
      /^green-office\/evidence$/,
      /^org-admin\/revision-center$/,
      /^executive\/dashboard$/,
      /^org\/profile$/,
      /^assessor\/profile$/,
      /^requests$/,
      /^requests\/create$/,
      /^requests\/evaluate\/\d+$/,
      /^subscription$/,
      /^subscription\/billing$/,
      /^notifications$/
    ];
    
    return patterns.some(pattern => pattern.test(path));
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
