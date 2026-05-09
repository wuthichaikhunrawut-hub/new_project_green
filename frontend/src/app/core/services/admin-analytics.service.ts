import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  assessmentRequests: number;
  carbonReduction: number;
  assessorCount: number;
  verifiedAssessors: number;
  pendingAssessors: number;
  subscriptionRevenue: number;
  revenueMonth: number;
  planDistribution: { name: string; count: number }[];
  assessmentStats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  storageUsageGb: number;
  totalFiles: number;
  successRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/analytics';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAdminDashboardStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin-dashboard`, { headers: this.getHeaders() });
  }
}
