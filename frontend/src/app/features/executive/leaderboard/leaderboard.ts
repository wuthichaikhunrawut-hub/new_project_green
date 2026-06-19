import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ExecutiveService } from '../../../core/services/executive.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-executive-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.html',
  styleUrls: ['./leaderboard.css']
})
export class ExecutiveLeaderboardComponent implements OnInit {
  private executiveService = inject(ExecutiveService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  leaderboardData: any[] = [];
  isLoading = true;
  orgName = '';

  private rankChart: any = null;

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoading = true;
    
    forkJoin({
      dashboard: this.executiveService.getDashboard(),
      leaderboard: this.executiveService.getLeaderboard()
    }).subscribe({
      next: ({ dashboard, leaderboard }) => {
        this.orgName = dashboard.orgName;
        
        this.leaderboardData = (leaderboard || []).map((item) => {
          const score = item.assessmentScore || 85;
          return {
            rank: item.rank,
            unitName: item.unitName || 'หน่วยงานกลาง',
            totalEmission: item.totalEmission,
            auditScore: score,
            certifiedLevel: score >= 80 ? 'ดีเยี่ยม (ทอง)' : score >= 70 ? 'ดีมาก (เงิน)' : 'ดี (ทองแดง)',
            badgeClass: score >= 80 ? 'gold' : score >= 70 ? 'silver' : 'bronze',
            trend: item.reductionPercent > 10 ? 'up' : item.reductionPercent < 0 ? 'down' : 'neutral'
          };
        });
        
        this.isLoading = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.renderCharts();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load leaderboard', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private renderCharts() {
    if (!isPlatformBrowser(this.platformId) || this.leaderboardData.length === 0) return;
    
    import('apexcharts').then((module) => {
      const ApexCharts = module.default;
      
      if (this.rankChart) this.rankChart.destroy();

      const options = {
        chart: { 
          type: 'bar', 
          height: 350, 
          toolbar: { show: false },
          fontFamily: 'Prompt, Inter, sans-serif'
        },
        series: [{
          name: 'การปล่อยคาร์บอนรวม (tCO₂e)',
          data: this.leaderboardData.map(d => Math.round(d.totalEmission * 100) / 100)
        }],
        colors: ['#0d9488'],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '40%',
            borderRadius: 8,
            dataLabels: { position: 'top' }
          }
        },
        dataLabels: {
          enabled: true,
          formatter: (val: any) => `${val.toLocaleString()}`,
          offsetY: -20,
          style: { colors: ['#475569'], fontSize: '12px', fontWeight: 600 }
        },
        xaxis: {
          categories: this.leaderboardData.map(d => d.unitName),
          labels: { style: { colors: '#64748b', fontWeight: 500 } }
        },
        yaxis: {
          title: { text: 'ปริมาณคาร์บอน (tCO₂e)', style: { color: '#64748b', fontWeight: 600 } },
          labels: { style: { colors: '#64748b' } }
        },
        grid: { borderColor: 'rgba(226, 232, 240, 0.8)', strokeDashArray: 4 },
        tooltip: {
          theme: 'light',
          y: { formatter: (val: any) => `${val.toLocaleString()} tCO₂e` }
        }
      };

      this.rankChart = new ApexCharts(document.querySelector('#rankChart'), options);
      this.rankChart.render();
    });
  }
}
