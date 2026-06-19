import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GreenCriteria {
  id: number;
  category_number: number;
  criteria_code: string;
  criteria_name: string;
  max_score: number;
  description: string;
  year_version: number;
}

@Injectable({
  providedIn: 'root'
})
export class GreenCriteriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/green-criteria`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getCriteriaList(): Observable<GreenCriteria[]> {
    return this.http.get<GreenCriteria[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createCriteria(data: Partial<GreenCriteria>): Observable<GreenCriteria> {
    return this.http.post<GreenCriteria>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  updateCriteria(id: number, data: Partial<GreenCriteria>): Observable<GreenCriteria> {
    return this.http.put<GreenCriteria>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteCriteria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
