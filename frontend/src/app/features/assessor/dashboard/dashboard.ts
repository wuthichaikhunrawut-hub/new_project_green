import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestsService } from '../../../core/services/requests.service';

@Component({
  selector: 'app-assessor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styles: ``
})
export class AssessorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private requestsService = inject(RequestsService);

  stats = {
    pending: 0,
    inProgress: 0,
    completed: 0,
    nearDeadline: 0,
    avgScore: 0
  };
  pendingRequests: any[] = [];



  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.requestsService.getRequests().subscribe({
      next: (data) => {
        this.stats.pending = data.filter(r => r.status === 'PENDING').length;
        this.stats.inProgress = data.filter(r => r.status === 'REVISION_REQUESTED').length;
        this.stats.completed = data.filter(r => ['APPROVED', 'REJECTED'].includes(r.status)).length;
        this.stats.nearDeadline = 0;
        this.stats.avgScore = this.calculateAvgScore(data);
        this.pendingRequests = data.filter(r => r.status === 'PENDING').slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (err) => { console.error('Failed to load dashboard data', err); this.cdr.detectChanges(); }
    });
  }

  calculateAvgScore(requests: any[]): number {
    const scored = requests.filter(r => r.total_score && r.total_score > 0);
    if (scored.length === 0) return 0;
    const totalMax = scored.reduce((a, r) => a + (r.total_max_score || 50), 0);
    const totalActual = scored.reduce((a, r) => a + r.total_score, 0);
    return totalMax > 0 ? parseFloat(((totalActual / totalMax) * 5).toFixed(1)) : 0;
  }
}
