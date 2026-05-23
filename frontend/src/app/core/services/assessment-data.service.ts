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
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'x-org-id': JSON.parse(localStorage.getItem('currentOrg') || '{}').id?.toString() || ''
    });
  }

  getDraft(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/draft`, { headers: this.getHeaders() });
  }

  updateDraft(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }
}
