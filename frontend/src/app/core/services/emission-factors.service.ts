import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmissionFactor {
  id: string;
  scope: number;
  name: string;
  unit: string;
  factor_value: number;
  source: string;
  year: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmissionFactorsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/admin/emission-factors';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getFactors(): Observable<EmissionFactor[]> {
    return this.http.get<EmissionFactor[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createFactor(data: Partial<EmissionFactor>): Observable<EmissionFactor> {
    return this.http.post<EmissionFactor>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  updateFactor(id: string, data: Partial<EmissionFactor>): Observable<EmissionFactor> {
    return this.http.put<EmissionFactor>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteFactor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
