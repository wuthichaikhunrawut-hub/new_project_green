import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-quota-usage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quota-usage.html'
})
export class QuotaUsageComponent implements OnInit {
  private http = inject(HttpClient);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  logs: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.titleService.setTitle('การใช้งานโควตา - Green Sync');
    this.fetchLogs();
  }

  fetchLogs() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.http.get<any[]>('http://localhost:3001/subscriptions/my/quotas', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    })
      .subscribe({
        next: (res) => {
          this.logs = res;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching usage logs:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
