import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GreenOfficeService } from '../../../core/services/green-office.service';
import { CarbonService } from '../../../core/services/carbon.service';
import { OrgService } from '../../../core/services/org.service';
import { AuthService } from '../../../core/services/auth.service';
import { InsightsService } from '../../../core/services/insights.service';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class ExecutiveDashboardComponent implements OnInit, AfterViewInit {
  private greenService = inject(GreenOfficeService);
  private carbonService = inject(CarbonService);
  private orgService = inject(OrgService);
  private authService = inject(AuthService);
  private insightsService = inject(InsightsService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  greenScore = 0;
  carbonTotal = 0;
  orgTarget = 0;
  executiveSummary = '';
  isLoadingSummary = true;
  recommendations: any[] = [];
  isLoadingRecommendations = true;

  // Chart References
  private esgChart: any | null = null;
  private radarChart: any | null = null;
  private spark1: any | null = null;
  private spark2: any | null = null;
  private spark3: any | null = null;

  ngOnInit() {
    this.fetchDataAndGenerateInsights();
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  private fetchDataAndGenerateInsights() {
    const orgId = this.authService.getOrganizationId();
    if (orgId) {
      this.orgService.getOrganization(orgId).subscribe((data: any) => {
        this.orgTarget = data.target_reduction_percent || 20;
        
        // Fetch Green Score
        this.greenService.getCriteriaList().subscribe((criteria: any[]) => {
          const totalMax = criteria.reduce((sum: number, c: any) => sum + (c.max_score || 0), 0);
          const totalGot = criteria.reduce((sum: number, c: any) => sum + (c.current_score || 0), 0);
          this.greenScore = totalMax > 0 ? Math.round((totalGot / totalMax) * 100) : 0;
          
          // Fetch Carbon
          this.carbonService.getLogs().subscribe((logs: any[]) => {
            this.carbonTotal = (logs || []).reduce((sum: number, log: any) => sum + (log.emission || 0), 0);
            
            // Now call AI for Summary
            this.insightsService.getExecutiveSummary({
              greenScore: this.greenScore,
              carbonTotal: this.carbonTotal,
              orgTarget: this.orgTarget,
              extra: { industryAvg: 75, previousYear: this.carbonTotal * 1.12 }
            }).subscribe({
              next: (res: any) => {
                this.executiveSummary = res.summary;
                this.isLoadingSummary = false;
                this.cdr.markForCheck();
              },
              error: () => {
                this.executiveSummary = 'ไม่สามารถสร้างบทวิเคราะห์จาก AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
                this.isLoadingSummary = false;
                this.cdr.markForCheck();
              }
            });

            // Call AI for Recommendations
            this.insightsService.getRecommendations({
              weakPoints: ['Energy Usage', 'Waste Separation']
            }).subscribe({
              next: (res: any) => {
                this.recommendations = res.recommendations || [];
                this.isLoadingRecommendations = false;
                this.cdr.markForCheck();
              },
              error: () => {
                this.recommendations = [];
                this.isLoadingRecommendations = false;
                this.cdr.markForCheck();
              }
            });
            
            // Re-render charts when data is ready
            this.updateChartsData();
            this.cdr.markForCheck();
          });
        });
      });
    }
  }

  private updateChartsData() {
    if (this.esgChart) {
      this.esgChart.updateSeries([{ data: [65, 68, 72, 75, 78, 85, this.greenScore > 0 ? this.greenScore : 88, 92, 95] }]);
    }
  }

  private renderCharts() {
    if (!isPlatformBrowser(this.platformId)) return;
    import('apexcharts').then((module) => {
      const ApexCharts = module.default;
      
      this.renderEsgTrend(ApexCharts);
      this.renderRadar(ApexCharts);
      this.renderSparklines(ApexCharts);
    });
  }

  private renderEsgTrend(ApexCharts: any) {
    if (this.esgChart) this.esgChart.destroy();
    
    // ESG Performance and Forecast (Gradient Area Chart)
    const options = {
      chart: { type: 'area', height: 350, fontFamily: 'Inter, sans-serif', toolbar: { show: false }, zoom: { enabled: false } },
      series: [
        { name: 'ESG Score (Actual)', data: [65, 68, 72, 75, 78, 85, 88, null, null] },
        { name: 'AI Forecast', data: [null, null, null, null, null, null, 88, 92, 95] }
      ],
      colors: ['#0f766e', '#10b981'],
      stroke: { 
        curve: 'smooth', 
        width: [3, 3],
        dashArray: [0, 5] // Dashed line for forecast
      },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
      },
      xaxis: { 
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], 
        labels: { style: { colors: '#64748b', fontWeight: 500 } }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false } 
      },
      yaxis: { min: 40, max: 100, labels: { style: { colors: '#64748b', fontWeight: 500 } } },
      grid: { borderColor: 'rgba(203, 213, 225, 0.4)', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } } },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600, markers: { radius: 12 } },
      tooltip: { theme: 'light', style: { fontSize: '13px' } }
    };

    this.esgChart = new ApexCharts(document.querySelector('#apexEsgTrend'), options);
    this.esgChart.render();
  }

  private renderRadar(ApexCharts: any) {
    if (this.radarChart) this.radarChart.destroy();
    
    const options = {
      chart: { type: 'radar', height: 320, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
      series: [
        { name: 'องค์กรของคุณ', data: [80, 50, 30, 40, 100, 20] },
        { name: 'Industry Benchmark', data: [20, 30, 40, 80, 20, 80] },
      ],
      labels: ['Energy', 'Water', 'Waste', 'Paper', 'Fuel', 'Green Procurement'],
      colors: ['#10b981', '#cbd5e1'],
      stroke: { width: 2, colors: ['#10b981', '#94a3b8'] },
      fill: { opacity: 0.2, colors: ['#10b981', '#f1f5f9'] },
      markers: { size: 4, colors: ['#fff'], strokeColors: ['#10b981', '#94a3b8'], strokeWidth: 2 },
      yaxis: { show: false },
      xaxis: { labels: { style: { colors: '#475569', fontSize: '12px', fontWeight: 600 } } },
      plotOptions: {
        radar: { polygons: { strokeColors: '#e2e8f0', strokeWidth: 1, connectorColors: '#e2e8f0' } }
      },
      legend: { position: 'bottom', markers: { radius: 12 }, fontWeight: 500 },
      tooltip: { theme: 'light' }
    };

    this.radarChart = new ApexCharts(document.querySelector('#apexRadar'), options);
    this.radarChart.render();
  }

  private renderSparklines(ApexCharts: any) {
    const commonOptions = {
      chart: { type: 'area', width: '100%', height: '100%', sparkline: { enabled: true } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] } },
      tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: function (seriesName: string) { return '' } } }, marker: { show: false } }
    };

    if (this.spark1) this.spark1.destroy();
    this.spark1 = new ApexCharts(document.querySelector('#apexSpark1'), {
      ...commonOptions,
      series: [{ data: [47, 45, 54, 38, 56, 24, 65, 31, 37, 39, 62, 51, 35, 41, 35, 27, 93, 53, 61, 27, 54, 43, 19, 46] }],
      colors: ['#10b981']
    });
    this.spark1.render();

    if (this.spark2) this.spark2.destroy();
    this.spark2 = new ApexCharts(document.querySelector('#apexSpark2'), {
      ...commonOptions,
      series: [{ data: [60, 50, 40, 45, 30, 20, 15] }],
      colors: ['#0d9488']
    });
    this.spark2.render();

    if (this.spark3) this.spark3.destroy();
    this.spark3 = new ApexCharts(document.querySelector('#apexSpark3'), {
      ...commonOptions,
      series: [{ data: [10, 20, 40, 50, 60, 80, 90] }],
      colors: ['#0891b2']
    });
    this.spark3.render();
  }
}
