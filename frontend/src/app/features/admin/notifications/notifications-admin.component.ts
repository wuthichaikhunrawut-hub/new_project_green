import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationType } from '../../../core/services/notification.service';
import { OrgService } from '../../../core/services/org.service';
import { UsersService } from '../../../core/services/users.service';

type TargetType = 'ALL_SYSTEM' | 'ALL_ORG' | 'SPECIFIC_USER';

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-admin.component.html',
  styleUrls: ['./notifications-admin.component.css']
})
export class NotificationsAdminComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private orgService = inject(OrgService);
  private usersService = inject(UsersService);
  private cdr = inject(ChangeDetectorRef);

  organizations: any[] = [];
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  history: any[] = [];
  isLoadingHistory = false;
  
  targetType: TargetType = 'ALL_SYSTEM';
  selectedOrgId: number | null = null;
  selectedUserId: number | null = null;

  notification = {
    title: '',
    message: '',
    type: NotificationType.SYSTEM,
    link: ''
  };

  notificationTypes = [
    { value: NotificationType.SYSTEM, label: 'ประกาศทั่วไป' },
    { value: NotificationType.ASSESSMENT, label: 'การประเมิน' },
    { value: NotificationType.DEADLINE, label: 'แจ้งเตือนกำหนดส่ง' },
    { value: NotificationType.REQUEST, label: 'คำร้อง/คำขอ' },
    { value: NotificationType.URGENT, label: 'แจ้งเตือนสำคัญ' }
  ];

  isSending = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.orgService.getAll().subscribe(orgs => this.organizations = orgs);
    this.usersService.getUsers().subscribe(users => this.allUsers = users);
    this.loadHistory();
  }

  loadHistory() {
    this.isLoadingHistory = true;
    this.notificationService.getAllSystemNotifications().subscribe({
      next: (data) => {
        this.history = data;
        this.isLoadingHistory = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load notification history:', err);
        this.isLoadingHistory = false;
        this.cdr.markForCheck();
      }
    });
  }

  onOrgChange(orgId: any) {
    this.selectedOrgId = orgId ? Number(orgId) : null;
    this.selectedUserId = null;
    if (this.selectedOrgId) {
      this.filteredUsers = this.allUsers.filter(u => u.org_id == this.selectedOrgId);
    } else {
      this.filteredUsers = [];
    }
  }

  getRecipientCount(): number {
    if (this.targetType === 'ALL_SYSTEM') return this.allUsers.length;
    if (this.targetType === 'ALL_ORG') {
        return this.allUsers.filter(u => u.org_id == this.selectedOrgId).length;
    }
    if (this.targetType === 'SPECIFIC_USER') return this.selectedUserId ? 1 : 0;
    return 0;
  }

  send() {
    const recipientIds = this.getRecipientIds();
    if (recipientIds.length === 0) {
      this.errorMessage = 'กรุณาเลือกผู้รับการแจ้งเตือน';
      return;
    }

    this.isSending = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.notificationService.sendBulkNotification({
        title: this.notification.title,
        message: this.notification.message,
        type: this.notification.type,
        recipient_ids: recipientIds,
        link: this.notification.link || undefined
    }).subscribe({
      next: () => {
        this.successMessage = `ส่งการแจ้งเตือนสำเร็จแล้ว (${recipientIds.length} ผู้รับ)`;
        this.resetForm();
        this.isSending = false;
        this.loadHistory(); // Refresh history
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSending = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน';
        console.error(err);
        this.cdr.markForCheck();
      }
    });
  }

  private getRecipientIds(): number[] {
    if (this.targetType === 'ALL_SYSTEM') return this.allUsers.map(u => u.id);
    if (this.targetType === 'ALL_ORG') {
      return this.allUsers.filter(u => u.org_id == this.selectedOrgId).map(u => u.id);
    }
    if (this.targetType === 'SPECIFIC_USER' && this.selectedUserId) {
      return [Number(this.selectedUserId)];
    }
    return [];
  }

  resetForm() {
    this.notification = {
      title: '',
      message: '',
      type: NotificationType.SYSTEM,
      link: ''
    };
    this.targetType = 'ALL_SYSTEM';
    this.selectedOrgId = null;
    this.selectedUserId = null;
  }

  // Preview Helpers
  getPreviewIcon(): string {
    switch (this.notification.type) {
      case NotificationType.DEADLINE: return 'fa-clock';
      case NotificationType.ASSESSMENT: return 'fa-file-circle-check';
      case NotificationType.ACCOUNT: return 'fa-user-shield';
      case NotificationType.REQUEST: return 'fa-file-invoice';
      case NotificationType.URGENT: return 'fa-triangle-exclamation';
      default: return 'fa-circle-info';
    }
  }

  getPreviewIconClass(): string {
    switch (this.notification.type) {
      case NotificationType.DEADLINE: return 'bg-warning bg-opacity-10 text-warning';
      case NotificationType.ASSESSMENT: return 'bg-primary bg-opacity-10 text-primary';
      case NotificationType.ACCOUNT: return 'bg-success bg-opacity-10 text-success';
      case NotificationType.REQUEST: return 'bg-info bg-opacity-10 text-info';
      case NotificationType.URGENT: return 'bg-danger bg-opacity-10 text-danger';
      default: return 'bg-secondary bg-opacity-10 text-secondary';
    }
  }

  getPreviewBadgeClass(): string {
    return this.getPreviewIconClass();
  }

  getCategoryLabel(): string {
    const type = this.notificationTypes.find(t => t.value === this.notification.type);
    return type ? type.label : 'ทั่วไป';
  }

  getRecipientLabel(): string {
    if (this.targetType === 'ALL_SYSTEM') return 'ผู้ใช้งานทุกคนในระบบ';
    if (this.targetType === 'ALL_ORG') {
      const org = this.organizations.find(o => o.id == this.selectedOrgId);
      return org ? `ทุกคนใน ${org.name}` : 'เลือกองค์กร';
    }
    if (this.targetType === 'SPECIFIC_USER') {
      const user = this.allUsers.find(u => u.id == this.selectedUserId);
      return user ? user.username : 'เลือกผู้ใช้งาน';
    }
    return 'ไม่ได้เลือกผู้รับ';
  }
}
