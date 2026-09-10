import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ExecutiveService } from '../../../core/services/executive.service';

@Component({
  selector: 'app-executive-audit-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-summary.html',
  styleUrls: ['./audit-summary.css'],
})
export class ExecutiveAuditSummaryComponent implements OnInit {
  private executiveService = inject(ExecutiveService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  auditData: any[] = [];
  isLoading = true;
  orgName = '';

  ngOnInit() {
    this.loadAuditSummary();
  }

  loadAuditSummary() {
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.executiveService.getDashboard().subscribe({
      next: (data) => {
        this.orgName = data.orgName;

        this.auditData = data.approvedAssessments.map((assessment) => {
          const score = Number(assessment.totalScore || 0);
          return {
            unitName: assessment.assessmentYear
              ? `ผลประเมินปี ${assessment.assessmentYear}`
              : `ผลประเมิน #${assessment.id}`,
            overallProgress: score,
            overallStatus:
              score >= 80
                ? 'ผ่านเกณฑ์ดีเยี่ยม (ทอง)'
                : score >= 70
                  ? 'ผ่านเกณฑ์ดีมาก (เงิน)'
                  : 'ผ่านเกณฑ์ดี (ทองแดง)',
            statusClass: score >= 80 ? 'success' : score >= 70 ? 'warning' : 'danger',
            categories: [],
          };
        });

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load audit summary', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
