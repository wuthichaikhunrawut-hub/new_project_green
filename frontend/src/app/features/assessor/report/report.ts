import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AssessorService } from '../../../core/services/assessor.service';
import { AssessorAssessment, OrgCarbonSummary } from '../../../core/models/assessor.model';
import { ToastService } from '../../../shared/services/toast.service';

interface CategorySummary {
  categoryId: number;
  name: string;
  maxScore: number;
  score: number;
}

@Component({
  selector: 'app-assessor-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report.html',
  styleUrl: './report.css'
})
export class AssessorReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private assessorService = inject(AssessorService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private location = inject(Location);

  assessmentId!: number;
  assessment: AssessorAssessment | null = null;
  categories: CategorySummary[] = [];
  maxScoreSum = 0;
  isLoading = true;
  carbonSummary: OrgCarbonSummary | null = null;
  currentYear = new Date().getFullYear() + 543; // พ.ศ.

  ngOnInit() {
    this.assessmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.assessmentId) {
      this.loadReport();
    }
  }

  loadReport() {
    this.isLoading = true;
    this.assessorService.getAssessment(this.assessmentId).subscribe({
      next: (data) => {
        this.assessment = data;
        this.calculateCategories();

        // โหลดข้อมูลคาร์บอนขององค์กร
        if (data.org_id) {
          this.loadCarbonSummary(data.org_id);
        }

        this.isLoading = false;
        this.cdr.markForCheck();

        // Auto print if query param is set
        if (this.route.snapshot.queryParamMap.get('print') === 'true') {
          setTimeout(() => {
            this.print();
          }, 500);
        }
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('โหลดรายงานไม่สำเร็จ');
        this.cdr.markForCheck();
      }
    });
  }

  loadCarbonSummary(orgId: number) {
    this.assessorService.getCarbonSummary(orgId).subscribe({
      next: (summary) => {
        this.carbonSummary = summary;
        this.cdr.markForCheck();
      },
      error: () => {
        // ข้อมูลคาร์บอนเป็นทางเลือก ไม่ต้องแจ้ง error
        this.carbonSummary = null;
      }
    });
  }

  calculateCategories() {
    if (!this.assessment || !this.assessment.details) return;

    const catMap = new Map<number, CategorySummary>();
    this.maxScoreSum = 0;

    for (const detail of this.assessment.details) {
      if (!detail.criteria) continue;
      const catNum = detail.criteria.category_number ?? detail.criteria.category_id ?? 0;
      const catName = detail.criteria.category_name ?? 'หมวดทั่วไป';

      const existing = catMap.get(catNum);
      if (existing) {
        existing.maxScore += detail.criteria.max_score || 0;
        existing.score += detail.assessor_score || 0;
      } else {
        catMap.set(catNum, {
          categoryId: catNum,
          name: catName,
          maxScore: detail.criteria.max_score || 0,
          score: detail.assessor_score || 0
        });
      }
    }

    this.categories = Array.from(catMap.values()).sort((a, b) => a.categoryId - b.categoryId);
    this.maxScoreSum = this.categories.reduce((sum, c) => sum + c.maxScore, 0);
  }

  /** ผลการรับรอง (ภาษาไทยล้วน) */
  get certLevelThai(): string {
    if (this.assessment?.certified_level) {
      return this.assessment.certified_level;
    }
    const score = this.assessment?.total_score || 0;
    if (score >= 90) return '🥇 ผ่านเกณฑ์ระดับทอง';
    if (score >= 70) return '🥈 ผ่านเกณฑ์ระดับเงิน';
    if (score >= 50) return '🥉 ผ่านเกณฑ์ระดับทองแดง';
    return '— ไม่ผ่านเกณฑ์';
  }

  /** backward compatibility */
  get certLevel(): string {
    return this.certLevelThai;
  }

  /** ชื่อ Scope ภาษาไทย */
  getScopeThaiLabel(scope: number): string {
    const labels: Record<number, string> = {
      1: 'ทางตรง (Scope 1)',
      2: 'พลังงาน (Scope 2)',
      3: 'ทางอ้อม (Scope 3)',
    };
    return labels[scope] || `Scope ${scope}`;
  }

  /** คำนวณเปอร์เซ็นต์แถบ scope */
  getScopePercent(emission: number): number {
    if (!this.carbonSummary) return 0;
    const max = Math.max(...this.carbonSummary.scopes.map(s => s.totalEmission), 1);
    return Math.max((emission / max) * 100, 5);
  }

  print() {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }

  goBack() {
    if (isPlatformBrowser(this.platformId)) {
      if (window.history.length > 1 && document.referrer) {
        this.location.back();
      } else {
        window.close(); // Close the tab if there's no history (e.g. opened via _blank)
      }
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
