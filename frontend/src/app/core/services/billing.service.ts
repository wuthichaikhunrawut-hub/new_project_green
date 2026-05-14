import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/payments';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createSetupIntent(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.apiUrl}/setup-intent`, {}, { headers: this.getHeaders() });
  }

  getPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/methods`, { headers: this.getHeaders() });
  }

  deletePaymentMethod(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/methods/${id}`, { headers: this.getHeaders() });
  }
}
