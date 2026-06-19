import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { ExecutiveDashboardResponse } from '../models/executive.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExecutiveService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}/executive`;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {

      }
    }
    return headers;
  }

  getDashboard(): Observable<ExecutiveDashboardResponse> {
    return this.http.get<ExecutiveDashboardResponse>(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders(),
    });
  }

  setGoal(targetReductionPercent: number, year: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/goals`, { targetReductionPercent, year }, {
      headers: this.getHeaders(),
    });
  }

  getLeaderboard(year?: number): Observable<any[]> {
    const url = year ? `${this.apiUrl}/leaderboard?year=${year}` : `${this.apiUrl}/leaderboard`;
    return this.http.get<any[]>(url, {
      headers: this.getHeaders(),
    });
  }

  getCustomGoals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/custom-goals`, {
      headers: this.getHeaders(),
    });
  }

  saveCustomGoals(goals: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/custom-goals`, { goals }, {
      headers: this.getHeaders(),
    });
  }
}
