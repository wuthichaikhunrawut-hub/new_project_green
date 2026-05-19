import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { EvidenceReviewItem, OrgCarbonSummary } from '../../../core/models/assessor.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-assessor-evidence-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './evidence-review.html',
})
export class AssessorEvidenceReviewComponent implements OnInit {
  private readonly assessorService = inject(AssessorService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  requestId = 0;
  orgId = 0;
  requestName = '';
  carbonSummary: OrgCarbonSummary | null = null;
  evidenceItems: EvidenceReviewItem[] = [];
  isLoading = true;
  isSaving = false;

  get passedCount(): number {
    return this.evidenceItems.filter((i) => i.result === 'PASS').length;
  }
  get failedCount(): number {
    return this.evidenceItems.filter((i) => i.result === 'FAIL').length;
  }
  get pendingCount(): number {
    return this.evidenceItems.filter((i) => !i.result).length;
  }

  ngOnInit(): void {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadRequest();
  }

  loadRequest(): void {
    this.isLoading = true;
    this.assessorService.getAssessment(this.requestId).subscribe({
      next: (req) => {
        this.requestName = req.organization?.name ?? 'ไม่พบข้อมูลองค์กร';
        this.orgId = req.org_id ?? req.organization?.id ?? 0;
        this.evidenceItems = (req.details ?? []).map((d) => ({
          assessment_detail_id: d.id,
          criteria_code: d.criteria?.criteria_code,
          criteria_name: d.criteria?.criteria_name ?? 'เกณฑ์',
          max_score: d.criteria?.max_score ?? 5,
          evidence_files: (d.evidence_files ?? []).map((f) => ({
            id: f.id,
            file_name: f.file_name,
            file_url: f.file_url,
            file_type: f.file_type,
            category: f.category,
          })),
          comment: d.auditor_comment ?? '',
          result: d.assessor_score > 0 ? 'PASS' : d.assessor_score === 0 && d.auditor_comment ? 'FAIL' : null,
        }));
        if (this.orgId) {
          this.assessorService.getCarbonSummary(this.orgId).subscribe({
            next: (summary) => {
              this.carbonSummary = summary;
              this.cdr.detectChanges();
            },
          });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดข้อมูลไม่สำเร็จ');
        this.cdr.detectChanges();
      },
    });
  }

  setResult(item: EvidenceReviewItem, result: 'PASS' | 'FAIL'): void {
    item.result = result;
  }

  openEvidence(url?: string): void {
    if (url) window.open(url, '_blank', 'noopener');
  }

  saveEvidence(): void {
    if (this.pendingCount > 0) {
      this.toast.error('ยังตรวจไม่ครบ', 'กรุณาระบุผล PASS/FAIL ทุกเกณฑ์');
      return;
    }
    this.isSaving = true;
    const payload = {
      details: this.evidenceItems.map((item) => ({
        assessment_detail_id: item.assessment_detail_id,
        result: item.result as 'PASS' | 'FAIL',
        auditor_comment: item.comment,
        assessor_score: item.result === 'PASS' ? item.max_score : 0,
      })),
    };
    this.assessorService.saveEvidenceReview(this.requestId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('บันทึกผลการตรวจหลักฐานแล้ว');
        this.router.navigate(['/assessor/decide', this.requestId]);
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message ?? 'เกิดข้อผิดพลาด';
        this.toast.error('บันทึกไม่สำเร็จ', Array.isArray(msg) ? msg.join(', ') : String(msg));
        this.cdr.detectChanges();
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/assessor/assignments']);
  }
}
