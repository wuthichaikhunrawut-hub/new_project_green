import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ExecutiveService } from '../../../core/services/executive.service';
import { InsightsService } from '../../../core/services/insights.service';
import { ExecutiveDashboardResponse } from '../../../core/models/executive.model';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class ExecutiveDashboardComponent implements OnInit, AfterViewInit {
  private executiveService = inject(ExecutiveService);
  private insightsService = inject(InsightsService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  dashboardData: ExecutiveDashboardResponse | null = null;
  isLoading = true;

  greenScore = 0;
  carbonTotal = 0;
  orgTarget = 0;
  netZeroProgressPercent = 0;
  approvedCount = 0;
  latestCertifiedLevel = '';
  
  executiveSummary = '';
  isLoadingSummary = true;
  isUpdatingSummary = false;
  recommendations: any[] = [];
  isLoadingRecommendations = true;
  isUpdatingRecommendations = false;

  // Chart References
  private unitChart: any | null = null;
  private scopeChart: any | null = null;
  private spark1: any | null = null;
  private spark2: any | null = null;
  private spark3: any | null = null;

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Initial empty rendering or handled after data load
  }

  private loadDashboardData() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoading = true;
    this.executiveService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.greenScore = Math.round(data.avgApprovedScore || 0);
        this.orgTarget = data.targetReductionPercent || 0;
        this.netZeroProgressPercent = data.netZeroProgressPercent || 0;
        this.approvedCount = data.approvedCount || 0;
        this.latestCertifiedLevel = data.latestCertifiedLevel || 'ยังไม่ได้รับรอง';
        this.carbonTotal = data.carbonByScope.reduce((sum, item) => sum + Number(item.totalEmission || 0), 0);
        this.isLoading = false;

        this.cdr.markForCheck();

        // Render charts once data is available
        this.renderCharts();
        
        // Call AI insights after getting real data
        this.fetchAiInsights();
      },
      error: (err) => {
        console.error('Failed to load executive dashboard data', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private fetchAiInsights() {
    if (!this.dashboardData) return;

    this.isLoadingSummary = true;
    this.isUpdatingSummary = true;
    this.isLoadingRecommendations = true;
    this.isUpdatingRecommendations = true;

    // Fetch AI Summary
    this.insightsService.getExecutiveSummary({
      greenScore: this.greenScore,
      carbonTotal: this.carbonTotal,
      orgTarget: this.orgTarget,
      extra: { 
        industryAvg: 75, 
        netZeroProgressPercent: this.netZeroProgressPercent,
        unitCount: this.dashboardData.carbonByUnit.length
      }
    }).subscribe({
      next: (res: any) => {
        this.executiveSummary = res.summary;
        this.isLoadingSummary = false;
        this.isUpdatingSummary = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.executiveSummary = `ปัจจุบันองค์กร ${this.dashboardData?.orgName || ''} ปล่อยคาร์บอนรวมสะสม ${this.carbonTotal.toLocaleString()} tCO₂e โดยมีประสิทธิภาพเป้าหมายลดคาร์บอน ${this.orgTarget}% ซึ่งปัจจุบันมีความคืบหน้าโครงการ Net Zero อยู่ที่ ${this.netZeroProgressPercent}% และมีคะแนน Green Office เฉลี่ยอยู่ที่ ${this.greenScore}%`;
        this.isLoadingSummary = false;
        this.isUpdatingSummary = false;
        this.cdr.markForCheck();
      }
    });

    // Fetch AI Recommendations based on Weak Points
    this.insightsService.getRecommendations({
      weakPoints: ['Energy Consumption in Units', 'Scope 2 indirect emissions']
    }).subscribe({
      next: (res: any) => {
        this.recommendations = res.recommendations || [];
        this.isLoadingRecommendations = false;
        this.isUpdatingRecommendations = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.recommendations = [
          { title: 'ปรับปรุงประสิทธิภาพไฟฟ้าในหน่วยงาน', action: 'ควรตรวจสอบหน่วยงานที่มีอัตราการปล่อย Scope 2 สูงสุด และปรับเปลี่ยนไปใช้อุปกรณ์ประหยัดไฟ LED หรือติดตั้ง Solar Rooftop', expectedImpact: 'High' },
          { title: 'รณรงค์การคัดแยกขยะเพื่อลดการปล่อยคาร์บอนทางอ้อม', action: 'ส่งเสริมการคัดแยกขยะอินทรีย์และขยะรีไซเคิลอย่างจริงจังในทุกแผนกย่อยเพื่อช่วยลด Scope 3', expectedImpact: 'Medium' }
        ];
        this.isLoadingRecommendations = false;
        this.isUpdatingRecommendations = false;
        this.cdr.markForCheck();
      }
    });
  }

  private renderCharts() {
    if (!isPlatformBrowser(this.platformId) || !this.dashboardData) return;
    import('apexcharts').then((module) => {
      const ApexCharts = module.default;
      
      this.renderUnitComparison(ApexCharts);
      this.renderScopeBreakdown(ApexCharts);
      this.renderSparklines(ApexCharts);
    });
  }

  private renderUnitComparison(ApexCharts: any) {
    if (this.unitChart) this.unitChart.destroy();
    if (!this.dashboardData) return;

    const unitData = this.dashboardData.carbonByUnit;
    const categories = unitData.map(u => u.unitName || 'ไม่ระบุหน่วยงาน');
    const seriesData = unitData.map(u => Math.round(u.totalEmission * 100) / 100);

    const options = {
      chart: { 
        type: 'bar', 
        height: 320, 
        toolbar: { show: false }, 
        fontFamily: 'Inter, Prompt, sans-serif',
        dropShadow: {
          enabled: true,
          top: 3,
          left: 3,
          blur: 6,
          opacity: 0.15,
          color: '#0d9488'
        }
      },
      series: [{ name: 'การปล่อยคาร์บอน (tCO₂e)', data: seriesData }],
      colors: ['#0d9488'],
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 8,
          dataLabels: { position: 'end' }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical', // specular highlight down the center of horizontal bar
          shadeIntensity: 0.45,
          gradientToColors: ['#14b8a6'],
          inverseColors: false,
          opacityFrom: 0.95,
          opacityTo: 0.8,
          stops: [0, 50, 100] // Creates a shiny 3D cylinder effect!
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => `${val.toLocaleString()} tCO₂e`,
        style: { colors: ['#ffffff'], fontSize: '11px', fontWeight: 600 }
      },
      xaxis: {
        categories: categories,
        labels: { style: { colors: '#64748b', fontWeight: 500 } }
      },
      yaxis: {
        labels: { style: { colors: '#0f172a', fontWeight: 600, fontSize: '12px' } }
      },
      grid: { borderColor: 'rgba(203, 213, 225, 0.4)', strokeDashArray: 4 },
      tooltip: {
        theme: 'light',
        y: { formatter: (val: any) => `${val.toLocaleString()} tCO₂e` }
      }
    };

    this.unitChart = new ApexCharts(document.querySelector('#apexUnitComparison'), options);
    this.unitChart.render();
  }

  private renderScopeBreakdown(ApexCharts: any) {
    if (this.scopeChart) this.scopeChart.destroy();
    if (!this.dashboardData) return;

    const scopeSums = [0, 0, 0]; // scope 1, 2, 3
    this.dashboardData.carbonByScope.forEach(item => {
      if (item.scope >= 1 && item.scope <= 3) {
        scopeSums[item.scope - 1] += Number(item.totalEmission || 0);
      }
    });

    const options = {
      chart: { 
        type: 'donut', 
        height: 320, 
        fontFamily: 'Inter, Prompt, sans-serif',
        dropShadow: {
          enabled: true,
          top: 6,
          left: 4,
          blur: 10,
          opacity: 0.18,
          color: '#0f172a'
        }
      },
      series: scopeSums.map(v => Math.round(v * 100) / 100),
      labels: ['Scope 1 (การปล่อยโดยตรง)', 'Scope 2 (พลังงานนำเข้า)', 'Scope 3 (การปล่อยทางอ้อมอื่นๆ)'],
      colors: ['#10b981', '#0d9488', '#0891b2'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'diagonal2',
          shadeIntensity: 0.25,
          opacityFrom: 0.95,
          opacityTo: 0.85,
          stops: [0, 100]
        }
      },
      legend: { position: 'bottom', fontWeight: 500, labels: { colors: '#475569' } },
      dataLabels: { enabled: true, formatter: (val: any) => `${val.toFixed(1)}%` },
      tooltip: { 
        theme: 'light', 
        y: { formatter: (val: any) => `${val.toLocaleString()} tCO₂e` } 
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                formatter: (val: any) => `${Number(val).toLocaleString()} tCO₂e`
              },
              total: {
                show: true,
                showAlways: true, // Keep the total label completely static on hover!
                label: 'ปล่อยรวมทั้งหมด',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                formatter: () => `${Math.round(this.carbonTotal).toLocaleString()} tCO₂e`
              }
            }
          }
        }
      }
    };

    this.scopeChart = new ApexCharts(document.querySelector('#apexScopeBreakdown'), options);
    this.scopeChart.render();
  }

  private renderSparklines(ApexCharts: any) {
    const commonOptions = {
      chart: { type: 'area', width: '100%', height: '100%', sparkline: { enabled: true } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
      tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: function () { return '' } } }, marker: { show: false } }
    };

    if (this.spark1) this.spark1.destroy();
    this.spark1 = new ApexCharts(document.querySelector('#apexSpark1'), {
      ...commonOptions,
      series: [{ data: [65, 68, 70, 72, 75, 78, this.greenScore > 0 ? this.greenScore : 78] }],
      colors: ['#0d9488']
    });
    this.spark1.render();

    if (this.spark2) this.spark2.destroy();
    this.spark2 = new ApexCharts(document.querySelector('#apexSpark2'), {
      ...commonOptions,
      series: [{ data: [100, 95, 88, 85, 82, 80, 78] }],
      colors: ['#2563eb']
    });
    this.spark2.render();

    if (this.spark3) this.spark3.destroy();
    this.spark3 = new ApexCharts(document.querySelector('#apexSpark3'), {
      ...commonOptions,
      series: [{ data: [0, 10, 25, 45, 60, 80, this.netZeroProgressPercent > 0 ? this.netZeroProgressPercent : 85] }],
      colors: ['#7c3aed']
    });
    this.spark3.render();
  }
}

