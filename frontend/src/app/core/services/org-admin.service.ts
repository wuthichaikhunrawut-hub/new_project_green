import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { RevisionCenterResponse } from '../models/org-admin.model';
import { Assessment } from '../models/assessment.model';

@Injectable({ providedIn: 'root' })
export class OrgAdminService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = 'http://localhost:3001/org-admin';

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

  getRevisionCenter(): Observable<RevisionCenterResponse> {
    return this.http.get<RevisionCenterResponse>(`${this.apiUrl}/revision-center`, {
      headers: this.getHeaders(),
    });
  }

  sendToUser(assessmentId: number, notes: string): Observable<Assessment> {
    return this.http.patch<Assessment>(
      `${this.apiUrl}/revision-center/${assessmentId}/send-to-user`,
      { notes },
      { headers: this.getHeaders() },
    );
  }

  resubmit(assessmentId: number, notes?: string): Observable<Assessment> {
    return this.http.patch<Assessment>(
      `${this.apiUrl}/revision-center/${assessmentId}/resubmit`,
      { notes },
      { headers: this.getHeaders() },
    );
  }
}
