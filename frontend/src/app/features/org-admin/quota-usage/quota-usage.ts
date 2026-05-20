import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  logs: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.titleService.setTitle('การใช้งานโควตา - Green Sync');
    this.fetchLogs();
  }

  fetchLogs() {
    this.isLoading = true;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>('http://localhost:3001/admin/subscriptions/usage', { headers })
      .subscribe({
        next: (res) => {
          this.logs = res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching usage logs:', err);
          this.isLoading = false;
        }
      });
  }
}
