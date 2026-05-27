import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrgAdminService } from '../../../core/services/org-admin.service';
import { CarbonService } from '../../../core/services/carbon.service';
import { Assessment } from '../../../core/models/assessment.model';
import { CarbonLog } from '../../../core/models/carbon-log.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog';

type ActionType = 'sendToUser' | 'resubmit' | null;

@Component({
  selector: 'app-org-admin-revision-center',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './revision-center.html',
})
export class OrgAdminRevisionCenterComponent implements OnInit {
  private readonly orgAdminService = inject(OrgAdminService);
  private readonly carbonService = inject(CarbonService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isSaving = false;
  revisions: Assessment[] = [];
  carbonLogs: CarbonLog[] = [];
  activeRevision: Assessment | null = null;
  actionNote = '';

  confirmOpen = false;
  pendingAction: ActionType = null;
  confirmTitle = '';
  confirmMessage = '';

  editingLogId: number | null = null;
  editingUsageAmount: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.orgAdminService.getRevisionCenter().subscribe({
      next: (response) => {
        this.revisions = response.revisions;
        this.carbonLogs = response.carbonLogs;
        this.activeRevision = this.revisions[0] ?? null;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('โหลดข้อมูลไม่สำเร็จ');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectRevision(item: any) {
    this.activeRevision = item;
    this.actionNote = '';
    this.cancelEditCarbon();
  }

  openSendToUser(): void {
    if (!this.activeRevision) return;
    this.pendingAction = 'sendToUser';
    this.confirmTitle = 'ส่งต่อให้ผู้ใช้งานแก้ไข';
    this.confirmMessage = 'ยืนยันการส่งรายการนี้ต่อให้ผู้ใช้งานในองค์กรแก้ไขข้อมูล';
    this.confirmOpen = true;
  }

  openResubmit(): void {
    if (!this.activeRevision) return;
    this.pendingAction = 'resubmit';
    this.confirmTitle = 'ส่งกลับให้ผู้ตรวจประเมิน';
    this.confirmMessage = 'ยืนยันการส่งรายการนี้กลับไปให้ผู้ตรวจประเมินตรวจซ้ำ';
    this.confirmOpen = true;
  }

  onConfirmCancel(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onConfirmOk(): void {
    if (!this.activeRevision || !this.pendingAction) return;
    this.confirmOpen = false;
    this.isSaving = true;
    const assessmentId = this.activeRevision.id;

    if (this.pendingAction === 'sendToUser') {
      this.orgAdminService.sendToUser(assessmentId, this.actionNote).subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('ส่งกลับให้ผู้ใช้งานแล้ว');
          this.load();
        },
        error: () => {
          this.isSaving = false;
          this.toast.error('ส่งกลับผู้ใช้งานไม่สำเร็จ');
        },
      });
    } else {
      this.orgAdminService.resubmit(assessmentId, this.actionNote).subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('ส่งกลับให้ผู้ตรวจประเมินแล้ว');
          this.load();
        },
        error: () => {
          this.isSaving = false;
          this.toast.error('ส่งกลับผู้ตรวจประเมินไม่สำเร็จ');
        },
      });
    }
    this.pendingAction = null;
  }

  startEditCarbon(log: CarbonLog): void {
    this.editingLogId = log.id || null;
    this.editingUsageAmount = Number(log.usage_amount);
  }

  cancelEditCarbon(): void {
    this.editingLogId = null;
    this.editingUsageAmount = null;
  }

  saveCarbon(log: CarbonLog): void {
    if (this.editingUsageAmount === null || this.editingUsageAmount < 0) {
      this.toast.error('ค่าการใช้งานไม่ถูกต้อง');
      return;
    }
    this.isSaving = true;
    this.carbonService
      .updateLog(String(log.id), {
        usage_amount: this.editingUsageAmount,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('แก้ไขข้อมูลคาร์บอนแล้ว');
          this.cancelEditCarbon();
          this.load();
        },
        error: () => {
          this.isSaving = false;
          this.toast.error('แก้ไขข้อมูลคาร์บอนไม่สำเร็จ');
        },
      });
  }
}
