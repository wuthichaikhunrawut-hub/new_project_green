import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GreenOfficeService } from '../../core/services/green-office.service';
import { CarbonService, CarbonLog } from '../../core/services/carbon.service';
import { OrgService } from '../../core/services/org.service';
import { AuthService } from '../../core/services/auth.service';
import { RequestsService } from '../../core/services/requests.service';
import { InsightsService } from '../../core/services/insights.service';
import { ScoreIndicatorInput } from '../../core/services/audit-score.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private greenService = inject(GreenOfficeService);
  private carbonService = inject(CarbonService);
  private orgService = inject(OrgService);
  private authService = inject(AuthService);
  private requestsService = inject(RequestsService);
  private insightsService = inject(InsightsService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // Chart References
  private mainChart: any | null = null;
  mainChartType: 'area' | 'bar' | 'donut' = 'area';

  private sustainabilityGauge: any | null = null;
  private greenEnergyGauge: any | null = null;
  private carbonDonut: any | null = null;
  private energyBar: any | null = null;

  currentDate = new Date();
  greenScore = 0;
  carbonTotal = 0;
  energyUsage = 0;
  waterUsage = 0;
  wasteRecycled = 0;
  renewablePercentage = 0;

  orgData: any = null;
  orgTarget = 0;
  certificate: any = null;
  waitingForCertificate = false;
  certifiedLevel: string | null = null; // 'PLATINUM', 'PLUS', 'GOLD', 'SILVER', 'BRONZE' or null
  assessmentFailed = false;
  rejectionComment: string | null = null;
  isLoading = true;

  get roleKey(): string {
    const r = String(this.authService.getUser()?.role || '').trim().toUpperCase().split(' ').join('_');
    if (r === 'SYSTEM_ADMIN' || r === 'ADMIN') return 'SYSTEM_ADMIN';
    if (r === 'ORGANIZATION_ADMIN' || r === 'ORG_ADMIN') return 'ORG_ADMIN';
    if (r === 'EXECUTIVE') return 'EXECUTIVE';
    return 'USER';
  }

  get isOrgAdminOrExecutive(): boolean {
    return this.roleKey === 'ORG_ADMIN' || this.roleKey === 'SYSTEM_ADMIN' || this.roleKey === 'EXECUTIVE';
  }

  get isStandardUser(): boolean {
    return !this.isOrgAdminOrExecutive;
  }

  private carbonLogs: CarbonLog[] = [];
  private chartsRendered = false;

  scoreIndicators: ScoreIndicatorInput[] = [];
  recentActivities: any[] = [];
  
  aiRecommendations: any[] = [];
  isGeneratingAI = true;

  private http = inject(HttpClient);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const orgId = this.authService.getOrganizationId();
    if (orgId) {
      this.orgService.getOrganization(orgId).subscribe((data: any) => {
        this.orgData = data;
        this.orgTarget = data.target_reduction_percent || 0;
        this.cdr.markForCheck();
      });

      this.http.get<any[]>(`http://localhost:3001/audit-logs?org_id=${orgId}&limit=5`).subscribe({
        next: (logs: any[]) => {
          this.recentActivities = logs || [];
          this.cdr.markForCheck();
        },
        error: (err: any) => console.error('Failed to fetch recent activities', err)
      });
    }

    this.greenService.getCriteriaList().subscribe(criteria => {
      const totalMax = criteria.reduce((sum, c) => sum + (c.max_score || 0), 0);
      const totalGot = criteria.reduce((sum, c) => sum + (c.current_score || 0), 0);
      this.greenScore = totalMax > 0 ? Math.round((totalGot / totalMax) * 100) : 0; 
      this.cdr.markForCheck();

      if (this.chartsRendered) {
        this.renderSustainabilityGauge();
      }
    });

    this.requestsService.getRequests().subscribe({
      next: (requests) => {
        // Sort requests to find the latest overall
        const sorted = [...requests].sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
        const latest = sorted[0];

        // Check if the latest request is REJECTED (Failed)
        if (latest && latest.status === 'REJECTED') {
          this.assessmentFailed = true;
          this.rejectionComment = (latest as any).assessor_comment || (latest as any).comment || (latest as any).rejection_reason || 'ผลการประเมินรอบล่าสุดยังไม่เป็นไปตามเกณฑ์มาตรฐาน Green Office';
        } else {
          this.assessmentFailed = false;
        }

        // Find the latest APPROVED assessment
        const approved = requests.find(r => r.status === 'APPROVED');
        if (approved) {
          // Parse certified level safely (handling values like 'G Platinum', 'G Plus', '🥇 ทอง (Gold)', '🥈 เงิน (Silver)', '🥉 ทองแดง (Bronze)')
          const rawLevel = approved.certified_level ? approved.certified_level.toUpperCase() : '';
          if (rawLevel.includes('PLATINUM') || rawLevel.includes('แพลทินัม')) {
            this.certifiedLevel = 'PLATINUM';
          } else if (rawLevel.includes('PLUS') || rawLevel.includes('พลัส')) {
            this.certifiedLevel = 'PLUS';
          } else if (rawLevel.includes('GOLD') || rawLevel.includes('ทอง')) {
            this.certifiedLevel = 'GOLD';
          } else if (rawLevel.includes('SILVER') || rawLevel.includes('เงิน')) {
            this.certifiedLevel = 'SILVER';
          } else if (rawLevel.includes('BRONZE') || rawLevel.includes('ทองแดง')) {
            this.certifiedLevel = 'BRONZE';
          } else {
            // Robust score fallback if certifiedLevel is missing or unrecognized in DB
            const score = approved.total_score || 0;
            if (score >= 95) this.certifiedLevel = 'PLATINUM';
            else if (score >= 90) this.certifiedLevel = 'GOLD';
            else if (score >= 80) this.certifiedLevel = 'SILVER';
            else if (score >= 60) this.certifiedLevel = 'BRONZE';
            else this.certifiedLevel = null;
          }

          const cert = approved.certificates?.find((c: any) => c.certificate_url || c.certificate_no);
          if (cert) {
            this.certificate = cert;
            this.waitingForCertificate = false;
          } else {
            this.waitingForCertificate = true;
          }
        }
        this.cdr.markForCheck();
      },
      error: () => console.error('Could not fetch assessment requests')
    });

    this.carbonService.getLogs().subscribe({
      next: (logs) => {
        this.carbonLogs = logs || [];
        if (this.carbonLogs.length === 0) {
          this.carbonTotal = 0;
          this.energyUsage = 0;
          this.waterUsage = 0;
          this.renewablePercentage = 0;
        } else {
          this.carbonTotal = this.carbonLogs.reduce((sum, log) => sum + (log.emission || 0), 0);
          this.energyUsage = this.carbonLogs
            .filter(l => l.type === 'Electricity')
            .reduce((sum, l) => sum + (l.amount || 0), 0);
          this.waterUsage = this.carbonLogs
            .filter(l => l.type === 'Water')
            .reduce((sum, l) => sum + (l.amount || 0), 0);
          
          const totalEnergy = this.energyUsage;
          const renewable = this.carbonLogs
            .filter(l => l.type === 'RenewableEnergy' || l.type === 'Solar')
            .reduce((sum, l) => sum + (l.amount || 0), 0);
          this.renewablePercentage = totalEnergy > 0 ? Math.round((renewable / totalEnergy) * 100) : 0;

          const wasteLogs = this.carbonLogs.filter(l => l.type === 'Waste');
          this.wasteRecycled = wasteLogs.length > 0 
            ? wasteLogs.reduce((sum, l) => sum + ((l as any).recycled_percent || 0), 0) / wasteLogs.length
            : 0;
        }
        
        // Hide loader when main data is fetched
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
          
          // Render charts after the *ngIf="!isLoading" DOM elements are created
          setTimeout(() => {
            if (this.chartsRendered) {
              this.renderAllCharts();
            }
          }, 100);
        }, 300);

        // Fetch AI Recommendations based on data
        this.fetchAIRecommendations();
      },
      error: () => {
        console.error('Could not fetch logs for dashboard');
        this.isLoading = false;
        this.isGeneratingAI = false;
        this.cdr.markForCheck();
      }
    });
  }

  private fetchAIRecommendations() {
    const energyTarget = this.orgData?.target_energy || 1000;
    const recycleTarget = this.orgData?.target_recycle || 50;
    const data = {
      weakPoints: [
        { topic: 'พลังงาน', score: this.energyUsage > energyTarget ? 'สูงเกินเกณฑ์' : 'ปกติ' },
        { topic: 'รีไซเคิล', score: this.wasteRecycled < recycleTarget ? 'ต้องปรับปรุง' : 'ผ่านเกณฑ์' }
      ]
    };
    this.insightsService.getRecommendations(data).subscribe({
      next: (res) => {
        this.aiRecommendations = res.recommendations || [];
        this.isGeneratingAI = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.aiRecommendations = [{ title: 'ไม่สามารถโหลดข้อเสนอแนะ AI ได้', action: 'กรุณาลองใหม่อีกครั้งภายหลัง', expectedImpact: 'ต่ำ' }];
        this.isGeneratingAI = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    this.chartsRendered = true;
    setTimeout(() => {
      if (!this.isLoading) {
        this.renderAllCharts();
      }
    }, 100);
  }

  private renderAllCharts() {
    if (!isPlatformBrowser(this.platformId)) return;
    import('apexcharts').then((module) => {
      const ApexCharts = module.default;
      this.renderMainChart(ApexCharts);
      this.renderSustainabilityGauge(ApexCharts);
      this.renderGreenEnergyGauge(ApexCharts);
      this.renderCarbonDonut(ApexCharts);
      this.renderEnergyBar(ApexCharts);
    });
  }

  setMainChartType(type: 'area' | 'bar' | 'donut') {
    if (this.mainChartType === type) return;
    this.mainChartType = type;
    if (isPlatformBrowser(this.platformId)) {
      import('apexcharts').then((module) => {
        this.renderMainChart(module.default);
      });
    }
  }

  private renderMainChart(ApexCharts: any) {
    if (this.mainChart) this.mainChart.destroy();
    
    // Core data
    const scope1Data = this.getMonthlyData(this.carbonLogs, 'Scope1');
    const scope2Data = this.getMonthlyData(this.carbonLogs, 'Scope2');
    const scope3Data = this.getMonthlyData(this.carbonLogs, 'Scope3');
    
    // In the main trend chart, let's show Scope 1 and Scope 2 (most significant)
    // or aggregate Scope 2+3 if the subtitle says Scope 3.
    // Let's stick to the labels: Scope 1 and Scope 3 (as placeholders for Indirect)
    const combinedIndirect = scope2Data.map((val, idx) => val + scope3Data[idx]);

    const categories = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

    let options: any;

    if (this.mainChartType === 'donut') {
      // Donut/Pie Mode
      const scope1Total = scope1Data.reduce((a, b) => a + b, 0);
      const scope3Total = scope3Data.reduce((a, b) => a + b, 0);
      options = {
        chart: { type: 'donut', height: 350, fontFamily: 'Inter, sans-serif' },
        series: [scope1Total, scope3Total],
        labels: ['ทางตรง (Scope 1)', 'ทางอ้อมอื่นๆ (Scope 3)'],
        colors: ['#0ea5e9', '#10b981'],
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                name: { show: true, fontSize: '14px', color: '#6b7280' },
                value: { show: true, fontSize: '24px', fontWeight: 600, color: '#111827', formatter: (val: any) => val + ' tCO₂e' },
                total: { show: true, showAlways: true, label: 'รวมทั้งหมด', formatter: () => (scope1Total + scope3Total) + ' tCO₂e' }
              }
            }
          }
        },
        dataLabels: { enabled: false },
        legend: { position: 'bottom', fontSize: '13px', fontWeight: 500, labels: { colors: '#374151' }, markers: { radius: 12 } },
        stroke: { show: true, colors: ['#ffffff'], width: 2 },
        tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: 'Inter' } }
      };
    } else {
      // Area or Bar Mode
      options = {
        chart: { 
          type: this.mainChartType, 
          height: 350, 
          toolbar: { show: false }, 
          fontFamily: 'Inter, sans-serif', 
          stacked: this.mainChartType === 'bar' 
        },
        series: [
          { name: 'ทางตรง (Scope 1)', data: scope1Data },
          { name: 'ทางอ้อม (Scope 2 & 3)', data: combinedIndirect }
        ],
        colors: ['#0ea5e9', '#10b981'],
        dataLabels: { enabled: false },
        stroke: { 
          curve: 'smooth', 
          width: this.mainChartType === 'area' ? 2 : 0,
          colors: this.mainChartType === 'area' ? ['#0ea5e9', '#10b981'] : ['transparent']
        },
        fill: {
          type: this.mainChartType === 'area' ? 'gradient' : 'solid',
          gradient: this.mainChartType === 'area' ? { shadeIntensity: 1, opacityFrom: 0.15, opacityTo: 0.0, stops: [0, 90, 100] } : undefined,
          opacity: 1
        },
        plotOptions: {
          bar: { columnWidth: '50%', borderRadius: 2 }
        },
        xaxis: {
          categories: categories,
          labels: { style: { colors: '#6b7280', fontSize: '11px', fontWeight: 500 } },
          axisBorder: { show: false }, axisTicks: { show: false },
          tooltip: { enabled: false }
        },
        yaxis: {
          min: 0, 
          // Removed tickAmount to let ApexCharts auto-calculate it based on stacked values vs area values
          labels: { style: { colors: '#9ca3af', fontSize: '11px', fontWeight: 500 }, offsetX: -10 }
        },
        grid: { 
          borderColor: '#f3f4f6', strokeDashArray: 0, 
          xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } },
          padding: { top: 0, right: 0, bottom: 0, left: 10 }
        },
        legend: { position: 'top', horizontalAlign: 'right', markers: { radius: 12 }, fontSize: '12px', fontWeight: 500, labels: { colors: '#4b5563' } },
        tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: 'Inter' } }
      };
    }

    this.mainChart = new ApexCharts(document.querySelector('#apexMainChart'), options);
    this.mainChart.render();
  }

  private getMonthlyData(logs: CarbonLog[], scopeType: 'Scope1' | 'Scope2' | 'Scope3'): number[] {
    const monthlyValues = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate.getFullYear() === currentYear) {
        const month = logDate.getMonth();
        const type = (log.type || '').toLowerCase();
        
        let belongsTo = '';
        if (type.includes('gasoline') || type.includes('diesel')) belongsTo = 'Scope1';
        else if (type.includes('electric')) belongsTo = 'Scope2';
        else belongsTo = 'Scope3';

        if (belongsTo === scopeType) {
          monthlyValues[month] += log.emission || 0;
        }
      }
    });

    return monthlyValues;
  }

  private getEnergyUsageByMonth(logs: CarbonLog[]): { renewable: number[], grid: number[] } {
    const renewable = new Array(12).fill(0);
    const grid = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate.getFullYear() === currentYear && (log.type || '').toLowerCase().includes('electric')) {
        const month = logDate.getMonth();
        // For now, let's assume all electricity is grid unless we have a flag
        grid[month] += log.amount || 0;
      }
    });

    return { renewable, grid };
  }

  private renderSustainabilityGauge(ApexCharts?: any) {
    if (!ApexCharts) return;
    if (this.sustainabilityGauge) this.sustainabilityGauge.destroy();
    const score = this.greenScore || 0;
    const options = {
      chart: { type: 'radialBar', height: 260, fontFamily: 'Inter, sans-serif' },
      series: [score],
      colors: ['#059669'], // Deeper Emerald
      plotOptions: {
        radialBar: {
          hollow: { size: '70%' },
          track: { background: '#f3f4f6', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: { fontSize: '36px', fontWeight: 600, color: '#111827', offsetY: 12, show: true, formatter: (val: any) => val }
          }
        }
      },
      stroke: { lineCap: 'round' }
    };
    this.sustainabilityGauge = new ApexCharts(document.querySelector('#apexSustainabilityGauge'), options);
    this.sustainabilityGauge.render();
  }

  private renderGreenEnergyGauge(ApexCharts: any) {
    if (this.greenEnergyGauge) this.greenEnergyGauge.destroy();
    const options = {
      chart: { type: 'radialBar', height: 260, offsetY: -20, sparkline: { enabled: true } },
      series: [this.renewablePercentage || 0],
      colors: ['#0ea5e9'], // Stripe Blue
      plotOptions: {
        radialBar: {
          startAngle: -90, endAngle: 90,
          track: { background: '#f3f4f6', strokeWidth: '97%', margin: 5 },
          dataLabels: {
            name: { show: false },
            value: { offsetY: -2, fontSize: '32px', fontWeight: 600, color: '#111827', formatter: (val: any) => val + '%' }
          }
        }
      },
      grid: { padding: { top: -10 } },
      fill: { type: 'gradient', gradient: { shade: 'light', shadeIntensity: 0.4, inverseColors: false, opacityFrom: 1, opacityTo: 1, stops: [0, 50, 53, 91] } }
    };

    this.greenEnergyGauge = new ApexCharts(document.querySelector('#apexGreenEnergyGauge'), options);
    this.greenEnergyGauge.render();
  }

  private renderCarbonDonut(ApexCharts: any) {
    if (this.carbonDonut) this.carbonDonut.destroy();
    const scope1 = this.carbonLogs.filter(l => (l.type || '').toLowerCase().includes('gasoline')).reduce((s, l) => s + l.emission, 0);
    const scope2 = this.carbonLogs.filter(l => (l.type || '').toLowerCase().includes('electric')).reduce((s, l) => s + l.emission, 0);
    const scope3 = this.carbonLogs.filter(l => !((l.type || '').toLowerCase().includes('electric') || (l.type || '').toLowerCase().includes('gasoline'))).reduce((s, l) => s + l.emission, 0);

    const options = {
      chart: { type: 'donut', height: 250, fontFamily: 'Inter, sans-serif' },
      series: [scope1, scope2, scope3],
      labels: ['Scope 1 (ตรง)', 'Scope 2 (พลังงาน)', 'Scope 3 (อื่นๆ)'],
      colors: ['#0f766e', '#0d9488', '#14b8a6'], // Teal spectrum
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: { show: false },
              value: { show: true, fontSize: '24px', fontWeight: 600, color: '#111827', formatter: (val: any) => val.toFixed(1) + ' t' },
              total: { show: true, showAlways: true, label: '', formatter: () => this.carbonTotal.toFixed(1) + ' t' }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, labels: { colors: '#4b5563' }, markers: { radius: 12 } },
      stroke: { show: true, colors: ['#ffffff'], width: 2 }
    };
    this.carbonDonut = new ApexCharts(document.querySelector('#apexCarbonDonut'), options);
    this.carbonDonut.render();
  }

  private renderEnergyBar(ApexCharts: any) {
    if (this.energyBar) this.energyBar.destroy();
    const { renewable, grid } = this.getEnergyUsageByMonth(this.carbonLogs);
    const options = {
      chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Inter, sans-serif', stacked: true },
      series: [
        { name: 'พลังงานหมุนเวียน (Renewable)', data: renewable },
        { name: 'ไฟฟ้าจากสายส่ง (Grid)', data: grid }
      ],
      colors: ['#0ea5e9', '#93c5fd'], // Blue palette
      plotOptions: { bar: { columnWidth: '45%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      xaxis: { categories: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#6b7280', fontSize: '11px', fontWeight: 500 } } },
      yaxis: { min: 0, labels: { style: { colors: '#9ca3af', fontSize: '11px', fontWeight: 500 } } },
      grid: { 
        borderColor: '#f3f4f6', 
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } } 
      },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 500, labels: { colors: '#4b5563' }, markers: { radius: 12 } },
      tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: 'Inter' } }
    };
    this.energyBar = new ApexCharts(document.querySelector('#apexEnergyBar'), options);
    this.energyBar.render();
  }

  exportPDF() {
    if (!isPlatformBrowser(this.platformId)) return;
    const element = document.getElementById('dashboard-wrapper');
    if (!element) return;
    html2canvas(element, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`GreenSync_Report_Dashboard.pdf`);
    });
  }
}