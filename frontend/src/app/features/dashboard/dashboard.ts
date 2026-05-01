import { Component, OnInit, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GreenOfficeService } from '../../core/services/green-office.service';
import { CarbonService, CarbonLog } from '../../core/services/carbon.service';
import { OrgService } from '../../core/services/org.service';
import { AuthService } from '../../core/services/auth.service';
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
  private platformId = inject(PLATFORM_ID);

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
  waterUsage = 16540; // Reference data
  wasteRecycled = 82; // Reference data
  renewablePercentage = 63; // Reference data
  renewableEnergy = 1850; 
  gridEnergy = 2550; 

  orgData: any = null;
  orgTarget = 0;

  private carbonLogs: CarbonLog[] = [];
  private chartsRendered = false;

  scoreIndicators: ScoreIndicatorInput[] = [];
  recentActivities = [];

  ngOnInit() {
    const orgId = this.authService.getOrganizationId();
    if (orgId) {
      this.orgService.getOrganization(orgId).subscribe((data: any) => {
        this.orgData = data;
        this.orgTarget = data.target_reduction_percent || 0;
      });
    }

    this.greenService.getCriteriaList().subscribe(criteria => {
      const totalMax = criteria.reduce((sum, c) => sum + c.maxScore, 0);
      const totalGot = criteria.reduce((sum, c) => sum + (c.currentScore || 0), 0);
      this.greenScore = totalMax > 0 ? Math.round((totalGot / totalMax) * 100) : 86; // mock 86 if 0 for reference

      if (this.chartsRendered) {
        this.renderSustainabilityGauge();
      }
    });

    this.carbonService.getLogs().subscribe({
      next: (logs) => {
        if (!logs || logs.length === 0) {
          this.carbonTotal = 7342;
          this.energyUsage = 1682450;
        } else {
          this.carbonTotal = logs.reduce((sum, log) => sum + log.emission, 0);
          this.energyUsage = logs.filter(l => l.type === 'Electricity').reduce((sum, l) => sum + l.amount, 0);
        }
        
        if (this.chartsRendered) {
          this.renderAllCharts();
        }
      },
      error: () => console.error('Could not fetch logs for dashboard')
    });
  }

  ngAfterViewInit() {
    this.chartsRendered = true;
    setTimeout(() => {
      this.renderAllCharts();
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
    const scope1Data = [50, 180, 210, 260, 210, 190, 290, 250, 280, 290, 310, 380, 420, 520, 550, 580, 720, 700, 740];
    const scope3Data = [20, 40, 80, 90, 110, 95, 120, 180, 140, 180, 200, 280, 290, 340, 380, 420, 520, 520, 540];
    const categories = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.'];

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
          { name: 'ทางอ้อมอื่นๆ (Scope 3)', data: scope3Data }
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

  private renderSustainabilityGauge(ApexCharts?: any) {
    if (!ApexCharts) return;
    if (this.sustainabilityGauge) this.sustainabilityGauge.destroy();
    const score = this.greenScore || 86;
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
      series: [63],
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
    const options = {
      chart: { type: 'donut', height: 250, fontFamily: 'Inter, sans-serif' },
      series: [45, 25, 20, 10],
      labels: ['Scope 1 (ตรง)', 'Scope 2 (พลังงาน)', 'Scope 3 (อื่นๆ)', 'ชดเชยแล้ว'],
      colors: ['#0f766e', '#0d9488', '#14b8a6', '#5eead4'], // Teal spectrum
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: { show: false },
              value: { show: true, fontSize: '24px', fontWeight: 600, color: '#111827', formatter: (val: any) => val + '%' },
              total: { show: true, showAlways: true, label: '', formatter: () => '45%' }
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
    const options = {
      chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Inter, sans-serif', stacked: true },
      series: [
        { name: 'พลังงานหมุนเวียน (Renewable)', data: [400, 600, 450, 700, 500, 1990] },
        { name: 'ไฟฟ้าจากสายส่ง (Grid)', data: [350, 400, 300, 450, 380, 1680] }
      ],
      colors: ['#0ea5e9', '#93c5fd'], // Blue palette
      plotOptions: { bar: { columnWidth: '45%', borderRadius: 2 } },
      dataLabels: { enabled: false },
      xaxis: { categories: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#6b7280', fontSize: '11px', fontWeight: 500 } } },
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