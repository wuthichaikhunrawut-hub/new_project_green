import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { UserSubscriptionsService } from '../../../core/services/user-subscriptions.service';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-quota-usage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quota-usage.html'
})
export class QuotaUsageComponent implements OnInit, OnDestroy {
  private subscriptionService = inject(UserSubscriptionsService);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  logs: any[] = [];
  subscription: any = null;
  isLoading = true;
  aiChart: any;
  barChart: any;
  private quotaSub: Subscription | null = null;

  ngOnInit() {
    this.titleService.setTitle('การใช้งานโควตา - Green Sync');
    this.loadDashboardData();

    this.quotaSub = this.subscriptionService.quotaUpdated$.subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy() {
    if (this.aiChart) this.aiChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.quotaSub) this.quotaSub.unsubscribe();
  }

  loadDashboardData() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      subscription: this.subscriptionService.getMySubscription(),
      quotas: this.subscriptionService.getMyQuotas()
    }).subscribe({
      next: (res) => {
        this.subscription = res.subscription;
        this.logs = res.quotas || [];
        this.isLoading = false;
        this.cdr.markForCheck();
        
        // Wait for DOM to update and render charts
        setTimeout(() => {
          this.renderCharts();
        }, 100);
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderCharts() {
    if (!isPlatformBrowser(this.platformId)) return;

    import('apexcharts').then((module) => {
      const ApexCharts = module.default;
      
      const aiQuota = this.logs.find(q => q.feature_code?.toUpperCase() === 'AI_SCAN');
      if (aiQuota) {
        const used = aiQuota.used || 0;
        const limit = aiQuota.limit || 50; // default to 50 if 0/undefined
        const percent = Math.min(Math.round((used / limit) * 100), 100);

        this.renderAiChart(ApexCharts, percent, used, limit);
      }

      this.renderBarChart(ApexCharts);
    });
  }

  private renderAiChart(ApexCharts: any, percent: number, used: number, limit: number) {
    if (this.aiChart) this.aiChart.destroy();

    const options = {
      series: [percent],
      chart: {
        type: 'radialBar',
        height: 280,
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            margin: 0,
            size: '70%',
            background: '#fff',
            position: 'front',
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.1
            }
          },
          track: {
            background: '#f1f5f9',
            strokeWidth: '67%',
            margin: 0,
            dropShadow: {
              enabled: true,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.05
            }
          },
          dataLabels: {
            show: true,
            name: {
              offsetY: -10,
              show: true,
              color: '#64748b',
              fontSize: '13px',
              fontFamily: 'Outfit, Inter, sans-serif'
            },
            value: {
              formatter: () => `${used} / ${limit}`,
              color: '#0f172a',
              fontSize: '22px',
              fontWeight: '900',
              fontFamily: 'Outfit, Inter, sans-serif',
              show: true,
              offsetY: 5
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#059669'],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      stroke: {
        dashArray: 4
      },
      labels: ['โควตาสแกนบิล AI']
    };

    const element = document.querySelector('#aiRadialChart');
    if (element) {
      this.aiChart = new ApexCharts(element, options);
      this.aiChart.render();
    }
  }

  private renderBarChart(ApexCharts: any) {
    if (this.barChart) this.barChart.destroy();

    // Prepare features comparison bar chart
    const categories = this.logs.map(q => q.feature_name || q.feature_code);
    const usedData = this.logs.map(q => q.used);

    const options = {
      series: [
        {
          name: 'ใช้งานแล้ว (Used)',
          data: usedData
        }
      ],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'Outfit, Inter, sans-serif'
      },
      colors: ['#10b981'],
      plotOptions: {
        bar: {
          borderRadius: 6,
          horizontal: true,
          barHeight: '45%',
          distributed: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => `${val} ครั้ง`,
        offsetX: 10,
        style: {
          fontSize: '11px',
          colors: ['#0f172a']
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        xaxis: { lines: { show: true } }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#334155',
            fontSize: '12px',
            fontWeight: 600
          }
        }
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (val: any, { dataPointIndex }: any) => {
            const limit = this.logs[dataPointIndex].limit;
            if (limit >= 999999 || limit === 0) {
              return `ใช้งาน: ${val} ครั้ง (ไม่จำกัด)`;
            }
            return `ใช้งาน: ${val} / ${limit} ครั้ง`;
          }
        }
      }
    };

    const element = document.querySelector('#quotaBarChart');
    if (element) {
      this.barChart = new ApexCharts(element, options);
      this.barChart.render();
    }
  }

  getPercent(used: number, limit: number): number {
    if (!limit) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  }

  isFeature(code: string, target: string): boolean {
    return code?.toUpperCase() === target?.toUpperCase();
  }
}
