import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { ScoreReviewItem } from '../../../core/models/assessor.model';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog';

type PendingAction = 'approve' | 'revision' | null;

@Component({
  selector: 'app-assessor-certification-decision',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './certification-decision.html',
})
export class AssessorCertificationDecisionComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  requestId = 0;
  requestName = '';
  scoreItems: ScoreReviewItem[] = [];
  overallComment = '';
  isSaving = false;
  isLoading = true;

  confirmOpen = false;
  pendingAction: PendingAction = null;
  confirmTitle = '';
  confirmMessage = '';
  confirmVariant: 'primary' | 'danger' = 'primary';

  get totalScore(): number {
    return this.scoreItems.reduce((a, i) => a + (i.assessor_score || 0), 0);
  }
  get totalMaxScore(): number {
    return this.scoreItems.reduce((a, i) => a + (i.max_score || 5), 0);
  }
  get scorePercent(): number {
    return this.totalMaxScore > 0 ? (this.totalScore / this.totalMaxScore) * 100 : 0;
  }

  ngOnInit(): void {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest();
  }

  loadRequest(): void {
    this.isLoading = true;
    this.assessorService.getAssessment(this.requestId).subscribe({
      next: (req) => {
        this.requestName = req.organization?.name ?? 'ไม่พบข้อมูล';
        this.overallComment = req.notes ?? '';
        this.scoreItems = (req.details ?? []).map((d) => ({
          assessment_detail_id: d.id,
          criteria_code: d.criteria?.criteria_code,
          criteria_name: d.criteria?.criteria_name ?? 'เกณฑ์',
          assessor_score: d.assessor_score ?? 0,
          max_score: d.criteria?.max_score ?? 5,
          auditor_comment: d.auditor_comment ?? '',
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดข้อมูลไม่สำเร็จ');
        this.cdr.markForCheck();
      },
    });
  }

  getCertificationLevel(): string {
    if (this.scorePercent >= 90) return 'ระดับ ทอง (Gold)';
    if (this.scorePercent >= 70) return 'ระดับ เงิน (Silver)';
    if (this.scorePercent >= 50) return 'ระดับ ทองแดง (Bronze)';
    return 'ไม่ผ่านการรับรอง';
  }

  openApproveConfirm(): void {
    this.pendingAction = 'approve';
    this.confirmVariant = 'primary';
    this.confirmTitle = 'อนุมัติผ่านเกณฑ์';
    this.confirmMessage = `ยืนยันอนุมัติ ${this.requestName} ระดับ ${this.getCertificationLevel()} (${Math.round(this.scorePercent)}% คะแนนรวม)`;
    this.confirmOpen = true;
  }

  openRevisionConfirm(): void {
    if (!this.overallComment.trim()) {
      this.toast.error('กรุณาระบุเหตุผล', 'ต้องกรอกความเห็นก่อนส่งกลับแก้ไข');
      return;
    }
    this.pendingAction = 'revision';
    this.confirmVariant = 'danger';
    this.confirmTitle = 'ส่งกลับไปแก้ไข';
    this.confirmMessage = `ส่งคำขอของ ${this.requestName} กลับให้องค์กรแก้ไขข้อมูลและหลักฐาน`;
    this.confirmOpen = true;
  }

  onConfirmCancel(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onConfirmOk(): void {
    const action = this.pendingAction;
    this.confirmOpen = false;
    this.pendingAction = null;
    if (action === 'approve') this.executeApprove();
    if (action === 'revision') this.executeRevision();
  }

  private buildDetailsPayload() {
    return this.scoreItems.map((item) => ({
      assessment_detail_id: item.assessment_detail_id,
      assessor_score: item.assessor_score,
      auditor_comment: item.auditor_comment,
    }));
  }

  executeApprove(): void {
    this.isSaving = true;
    this.assessorService
      .approve(this.requestId, {
        notes: this.overallComment,
        total_score: this.totalScore,
        certified_level: this.getCertificationLevel(),
        details: this.buildDetailsPayload(),
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('อนุมัติผ่านเกณฑ์เรียบร้อย');
          this.router.navigate(['/assessor/history']);
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err?.error?.message ?? 'เกิดข้อผิดพลาด';
          this.toast.error('อนุมัติไม่สำเร็จ', Array.isArray(msg) ? msg.join(', ') : String(msg));
          this.cdr.markForCheck();
        },
      });
  }

  executeRevision(): void {
    this.isSaving = true;
    this.assessorService
      .requestRevision(this.requestId, {
        notes: this.overallComment,
        details: this.buildDetailsPayload().map((d) => ({
          assessment_detail_id: d.assessment_detail_id,
          auditor_comment: d.auditor_comment,
        })),
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('ส่งกลับแก้ไขเรียบร้อย');
          this.router.navigate(['/assessor/assignments']);
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err?.error?.message ?? 'เกิดข้อผิดพลาด';
          this.toast.error('ส่งกลับไม่สำเร็จ', Array.isArray(msg) ? msg.join(', ') : String(msg));
          this.cdr.markForCheck();
        },
      });
  }

  saveDraft(): void {
    this.isSaving = true;
    this.assessorService
      .saveEvidenceReview(this.requestId, {
        details: this.scoreItems.map((item) => ({
          assessment_detail_id: item.assessment_detail_id,
          result: item.assessor_score >= item.max_score * 0.5 ? 'PASS' : 'FAIL',
          auditor_comment: item.auditor_comment,
          assessor_score: item.assessor_score,
        })),
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('บันทึกร่างคะแนนแล้ว');
        },
        error: () => {
          this.isSaving = false;
          this.toast.error('บันทึกร่างไม่สำเร็จ');
          this.cdr.markForCheck();
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/assessor/evidence', this.requestId]);
  }
}
