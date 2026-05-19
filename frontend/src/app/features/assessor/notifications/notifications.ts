import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { ToastService } from '../../../shared/services/toast.service';

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
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);
  private router = inject(Router);

  activeTab: 'all' | 'unread' = 'all';
  notifications: Notification[] = [];
  isLoading = true;

  get unreadCount() { return this.notifications.filter(n => !n.is_read).length; }

  get filteredNotifications() {
    return this.activeTab === 'unread'
      ? this.notifications.filter(n => !n.is_read)
      : this.notifications;
  }

  ngOnInit() { this.loadNotifications(); }

  loadNotifications() {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        // Sort newest first
        this.notifications = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { 
        this.isLoading = false;
        this.toast.error('ไม่สามารถโหลดการแจ้งเตือนได้');
        this.cdr.markForCheck(); 
      }
    });
  }

  markAsRead(n: Notification) {
    if (n.is_read) {
      if (n.link) this.navigateSafely(n.link);
      return;
    }
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        n.is_read = true;
        this.cdr.markForCheck();
        if (n.link) this.navigateSafely(n.link);
      }
    });
  }

  viewDetails(n: Notification) {
    this.markAsRead(n);
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
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.cdr.markForCheck();
        this.toast.success('ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว');
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
