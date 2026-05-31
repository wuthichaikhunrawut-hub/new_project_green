import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssessmentDataService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/assessments';

  private getHeaders(): HttpHeaders {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('access_token') || '';
      const orgStr = localStorage.getItem('currentOrg') || '{}';
      let orgId = '';
      try {
        const org = JSON.parse(orgStr);
        orgId = org?.id?.toString() || org?.org_id?.toString() || '';
      } catch (e) {}

      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-org-id': orgId
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getDraft(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/draft`, { headers: this.getHeaders() });
  }

  updateDraft(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }
}
