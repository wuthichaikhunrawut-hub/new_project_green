import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminAnalyticsService, AdminStats } from '../../../core/services/admin-analytics.service';
import { InsightsService } from '../../../core/services/insights.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  private analyticsService = inject(AdminAnalyticsService);
  private insightsService = inject(InsightsService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  stats: AdminStats = {
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    assessmentRequests: 0,
    carbonReduction: 0,
    assessorCount: 0,
    verifiedAssessors: 0,
    pendingAssessors: 0,
    subscriptionRevenue: 0,
    revenueMonth: 0,
    planDistribution: [],
    assessmentStats: { total: 0, approved: 0, pending: 0, rejected: 0 },
    storageUsageGb: 0,
    totalFiles: 0,
    successRate: 0
  };

  isLoading = true;
  adminAiSummary = '';
  isLoadingAi = true;

  private growthChart: any;

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  loadStats() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.isLoading = true;
    this.cdr.markForCheck();
    this.analyticsService.getAdminDashboardStats().subscribe({
      next: (data: any) => {
        this.stats = data;
        this.isLoading = false;
        this.cdr.markForCheck();
        this.loadAiSummary();
        this.loadAiRecommendations();
        this.renderCharts(); // Re-render with new data
      },
      error: (err) => {
        console.error('Failed to load admin stats:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAiSummary() {
    this.isLoadingAi = true;
    this.cdr.markForCheck();
    this.insightsService.getExecutiveSummary({
      greenScore: this.stats.successRate,
      carbonTotal: this.stats.carbonReduction,
      orgTarget: this.stats.totalOrganizations,
      extra: { adminView: true, revenue: this.stats.revenueMonth }
    }).subscribe({
      next: (res: any) => {
        this.adminAiSummary = res.summary;
        this.isLoadingAi = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.adminAiSummary = 'เกิดข้อจำกัดในการเชื่อมต่อ AI เนื่องจากโควตา API แบบฟรีถูกใช้งานเต็มลิมิต (ระบบจะรีเซ็ตใน 1 นาที)';
        this.isLoadingAi = false;
        this.cdr.markForCheck();
      }
    });
  }

  aiRecommendations: any[] = [];
  isGeneratingRecommendations = true;

  loadAiRecommendations() {
    this.isGeneratingRecommendations = true;
    this.cdr.markForCheck();
    this.insightsService.getRecommendations({
      weakPoints: [
        { topic: 'อัตราการผ่านเกณฑ์', score: this.stats.successRate < 50 ? 'ต่ำ' : 'ปานกลาง' },
        { topic: 'รายได้', score: this.stats.revenueMonth < 10000 ? 'ต้องเพิ่มยอด' : 'ดี' }
      ]
    }).subscribe({
      next: (res: any) => {
        this.aiRecommendations = res.recommendations || [];
        this.isGeneratingRecommendations = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.aiRecommendations = [
          { title: 'เพิ่มจำนวนองค์กรเป้าหมาย', action: 'จัดแคมเปญส่งเสริมการใช้งาน Green Office', expectedImpact: 'สูง' },
          { title: 'ตรวจสอบแพ็กเกจ', action: 'วิเคราะห์การอัปเกรดจาก Free เป็น Pro', expectedImpact: 'ปานกลาง' }
        ];
        this.isGeneratingRecommendations = false;
        this.cdr.markForCheck();
      }
    });
  }

  retryAi() {
    this.loadAiSummary();
    this.loadAiRecommendations();
  }

  renderCharts() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    import('apexcharts').then(module => {
      const ApexCharts = module.default;
      if (this.growthChart) this.growthChart.destroy();

      const options = {
        chart: { type: 'area', height: 300, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        series: [{ name: 'การเติบโตขององค์กร', data: [12, 19, 25, 32, 45, this.stats.totalOrganizations || 50] }],
        colors: ['#6366f1'],
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'], axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: '#9ca3af' } } },
        grid: { borderColor: '#f3f4f6', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
        tooltip: { theme: 'light' }
      };

      this.growthChart = new ApexCharts(document.querySelector('#adminGrowthChart'), options);
      this.growthChart.render();
    });
  }
}
