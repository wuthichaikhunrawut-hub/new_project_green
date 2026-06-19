import { ToastService } from '../../../core/services/toast.service';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RequestsService } from '../../../core/services/requests.service';
import { Assessment, AssessmentDetail } from '../../../core/models/assessment.model';
import { ThaiDatePipe } from '../../../shared/pipes/thai-date-pipe';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface CarbonScope {
  scope: number;
  label: string;
  totalEmission: number;
  logCount: number;
}

interface CarbonSummary {
  orgId: number;
  orgName: string;
  scopes: CarbonScope[];
  totalEmission: number;
}

interface CategoryGroup {
  categoryNumber: number;
  categoryName: string;
  details: AssessmentDetail[];
  maxScore: number;
  assessorScore: number;
}

@Component({
  selector: 'app-request-evaluate',
  standalone: true,
  imports: [CommonModule, FormsModule, ThaiDatePipe],
  templateUrl: './request-evaluate.html',
  styleUrl: './request-evaluate.css'
})
export class RequestEvaluateComponent implements OnInit, OnDestroy {
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private requestsService = inject(RequestsService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  request: Assessment | null = null;
  isLoading = true;
  isSaving = false;
  overallComment = '';

  // Tab / Category grouping
  activeTab = 0;
  categoryGroups: CategoryGroup[] = [];

  // Carbon summary
  carbonSummary: CarbonSummary | null = null;
  carbonLoading = false;

  // Confirm dialog state
  confirmAction: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED' | null = null;
  showConfirm = false;
  confirmTitle = '';
  confirmMsg = '';

  // Auto-save
  private autoSaveTimer: any;

  readonly CATEGORY_NAMES: Record<number, string> = {
    1: 'นโยบายและการจัดการ',
    2: 'การใช้พลังงานและทรัพยากร',
    3: 'คุณภาพสิ่งแวดล้อม',
    4: 'การปล่อยก๊าซเรือนกระจก',
    5: 'สภาพแวดล้อมและความปลอดภัย',
    6: 'การจัดซื้อจัดจ้างสีเขียว',
    7: 'การพัฒนาอย่างต่อเนื่อง',
  };

  get canEdit(): boolean {
    return this.request?.status !== 'APPROVED' && this.request?.status !== 'REJECTED';
  }

  get progressPercent(): number {
    if (!this.request?.details?.length) return 0;
    const scored = this.request.details.filter((d: any) => Number(d.assessor_score) > 0).length;
    return Math.round((scored / this.request.details.length) * 100);
  }

  get scoredCount(): number {
    return this.request?.details?.filter((d: any) => Number(d.assessor_score) > 0).length ?? 0;
  }

  get totalCount(): number {
    return this.request?.details?.length ?? 0;
  }

  get allScoredAndHasComment(): boolean {
    if (!this.overallComment.trim()) return false;
    return this.scoredCount === this.totalCount && this.totalCount > 0;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadRequest(id);
    else this.goBack();

    // Auto-save every 30s
    this.autoSaveTimer = setInterval(() => {
      if (this.canEdit && this.request && !this.isSaving) {
        this.saveData();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }

  loadRequest(id: string) {
    this.isLoading = true;
    this.requestsService.getRequestById(id).subscribe({
      next: (data: Assessment) => {
        this.request = data;
        if (!Array.isArray(this.request.details)) this.request.details = [];

        this.request.details.forEach((item: any) => {
          item.assessor_score = item.assessor_score; // keep null/undefined for unassessed state tracking
          item.auditor_comment = item.auditor_comment ?? '';
          if (!item.evidence_files || item.evidence_files.length === 0) {
            item.evidence_files = [];
          }
        });

        this.overallComment = this.request.notes ?? '';
        this.buildCategoryGroups();
        this.isLoading = false;
        this.cdr.markForCheck();

        // Load carbon summary after request loaded
        if (this.request.org_id) {
          this.loadCarbonSummary(this.request.org_id);
        }
      },
      error: () => {
        this.toast.success('ไม่พบข้อมูลคำร้องนี้');
        this.goBack();
      }
    });
  }

  loadCarbonSummary(orgId: number) {
    this.carbonLoading = true;
    this.http.get<CarbonSummary>(`${environment.apiUrl}/assessor/organizations/${orgId}/carbon-summary`)
      .subscribe({
        next: (data) => {
          this.carbonSummary = data;
          this.carbonLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carbonSummary = null;
          this.carbonLoading = false;
        }
      });
  }

  buildCategoryGroups() {
    if (!this.request?.details) return;
    const map = new Map<number, CategoryGroup>();

    this.request.details.forEach((detail: any) => {
      const cat = detail.criteria?.category_number ?? 1;
      if (!map.has(cat)) {
        map.set(cat, {
          categoryNumber: cat,
          categoryName: this.CATEGORY_NAMES[cat] ?? `หมวด ${cat}`,
          details: [],
          maxScore: 0,
          assessorScore: 0
        });
      }
      map.get(cat)!.details.push(detail);
    });

    this.categoryGroups = Array.from(map.values()).sort((a, b) => a.categoryNumber - b.categoryNumber);
    if (this.categoryGroups.length > 0) this.activeTab = 0;
  }

  getCategoryMaxScore(group: CategoryGroup): number {
    return group.details.reduce((s, d: any) => s + (Number(d.criteria?.max_score) || 5), 0);
  }

  getCategoryAssessorScore(group: CategoryGroup): number {
    return group.details.reduce((s, d: any) => s + (Number(d.assessor_score) || 0), 0);
  }

  getCategoryPercent(group: CategoryGroup): number {
    const max = this.getCategoryMaxScore(group);
    if (max === 0) return 0;
    return Math.round((this.getCategoryAssessorScore(group) / max) * 100);
  }

  calculateTotalAssessorScore(): number {
    return this.request?.details?.reduce((s: number, d: any) => s + (Number(d.assessor_score) || 0), 0) ?? 0;
  }

  calculateTotalMaxScore(): number {
    return this.request?.details?.reduce((s: number, d: any) => s + (Number(d.criteria?.max_score) || 5), 0) ?? 0;
  }

  getCertificationLevel(): { level: string; percent: number; color: string; bg: string } {
    const total = this.calculateTotalAssessorScore();
    const max = this.calculateTotalMaxScore();
    if (max === 0) return { level: 'ยังไม่มีข้อมูล', percent: 0, color: 'text-muted', bg: '#6b7280' };
    const percent = Math.round((total / max) * 100);
    if (percent >= 90) return { level: '🥇 ทอง (Gold)', percent, color: 'text-warning', bg: '#f59e0b' };
    if (percent >= 70) return { level: '🥈 เงิน (Silver)', percent, color: 'text-secondary', bg: '#6b7280' };
    if (percent >= 50) return { level: '🥉 ทองแดง (Bronze)', percent, color: 'text-danger', bg: '#b45309' };
    return { level: '❌ ไม่ผ่านเกณฑ์', percent, color: 'text-dark', bg: '#ef4444' };
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'รอตรวจ', SUBMITTED: 'ส่งแล้ว', IN_REVIEW: 'กำลังตรวจ',
      REVISION_REQUESTED: 'ขอแก้ไข', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธ', DRAFT: 'ร่าง'
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'status-pending', SUBMITTED: 'status-submitted', IN_REVIEW: 'status-in-review',
      REVISION_REQUESTED: 'status-revision', APPROVED: 'status-approved', REJECTED: 'status-rejected'
    };
    return map[status] ?? 'status-pending';
  }

  getScopeColor(scope: number): string {
    return ['', '#0ea5e9', '#059669', '#8b5cf6'][scope] ?? '#6b7280';
  }

  getScopeIcon(scope: number): string {
    return ['', 'fa-industry', 'fa-bolt', 'fa-arrow-right-arrow-left'][scope] ?? 'fa-leaf';
  }

  setPassFail(item: any, pass: boolean) {
    const max = Number(item.criteria?.max_score) || 5;
    item.assessor_score = pass ? max : 0;
  }

  isPass(item: any): boolean {
    if (item.assessor_score === null || item.assessor_score === undefined) return false;
    const max = Number(item.criteria?.max_score) || 5;
    return Number(item.assessor_score) >= (max / 2);
  }

  isFailing(item: any): boolean {
    if (item.assessor_score === null || item.assessor_score === undefined) return false;
    const max = Number(item.criteria?.max_score) || 5;
    return Number(item.assessor_score) < (max / 2);
  }
  getScore(item: any): number { return Number(item.assessor_score) || 0; }
  getComment(item: any): string { return item.auditor_comment ?? ''; }
  setComment(item: any, val: string) { item.auditor_comment = val; }
  setScore(item: any, event: Event) { item.assessor_score = Number((event.target as HTMLInputElement).value); }
  getSelfScore(item: any): number { return Number(item.self_score) || 0; }
  getApplicantComment(item: any): string { return item.applicant_comment ?? ''; }
  getEvidenceFiles(item: any): any[] { return item.evidence_files ?? []; }
  getFileName(f: any): string { return f.name ?? f.file_name ?? 'ไฟล์แนบ'; }
  getFileUrl(f: any): string { return f.url ?? f.file_url ?? '#'; }

  openConfirm(action: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED') {
    this.confirmAction = action;
    if (action === 'APPROVED') {
      const cert = this.getCertificationLevel();
      this.confirmTitle = 'ยืนยันการอนุมัติ';
      this.confirmMsg = `ท่านกำลังอนุมัติคำขอนี้ด้วยระดับ ${cert.level} (${cert.percent}%) ยืนยันหรือไม่?`;
    } else if (action === 'REVISION_REQUESTED') {
      this.confirmTitle = 'ยืนยันการขอแก้ไข';
      this.confirmMsg = 'ระบบจะส่งคำขอนี้กลับให้องค์กรแก้ไขข้อมูลและส่งใหม่ ยืนยันหรือไม่?';
    } else {
      this.confirmTitle = 'ยืนยันการปฏิเสธ';
      this.confirmMsg = 'คำขอนี้จะถูกปฏิเสธและไม่สามารถเปลี่ยนแปลงได้ ยืนยันหรือไม่?';
    }
    this.showConfirm = true;
  }

  onConfirmOk() {
    this.showConfirm = false;
    if (this.confirmAction) this.saveData(this.confirmAction);
    this.confirmAction = null;
  }

  onConfirmCancel() {
    this.showConfirm = false;
    this.confirmAction = null;
  }

  saveDraft() {
    this.saveData();
  }

  exportToPdf() {
    window.print();
  }

  private saveData(newStatus?: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED') {
    if (!this.request?.id) return;
    this.isSaving = true;
    const finalStatus = newStatus ?? (this.request.status as any);
    const payload: Partial<Assessment> = {
      status: finalStatus,
      notes: this.overallComment,
      total_score: this.calculateTotalAssessorScore(),
      certified_level: finalStatus === 'APPROVED' ? this.getCertificationLevel().level : undefined,
      details: (this.request.details ?? []).map((d: any) => ({
        assessment_detail_id: d.id,
        assessor_score: d.assessor_score ?? 0,
        auditor_comment: d.auditor_comment
      })) as any[]
    };

    this.requestsService.updateRequest(this.request.id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        if (newStatus) {
          this.toast.success(newStatus === 'APPROVED' ? '✅ อนุมัติคำขอเรียบร้อยแล้ว' :
            newStatus === 'REVISION_REQUESTED' ? '🔄 ส่งกลับให้องค์กรแก้ไขแล้ว' : '❌ ปฏิเสธคำขอเรียบร้อยแล้ว');
          this.goBack();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('เกิดข้อผิดพลาดในการบันทึก');
        this.isSaving = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
