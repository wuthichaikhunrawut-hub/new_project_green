import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { ExecutiveDashboardResponse } from '../models/executive.model';

@Injectable({ providedIn: 'root' })
export class ExecutiveService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = 'http://localhost:3001/executive';

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  getDashboard(): Observable<ExecutiveDashboardResponse> {
    return this.http.get<ExecutiveDashboardResponse>(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders(),
    });
  }
}
