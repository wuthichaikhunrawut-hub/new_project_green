import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/payments';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createSetupIntent(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.apiUrl}/setup-intent`, {}, { headers: this.getHeaders() });
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/methods`, { headers: this.getHeaders() });
  }

  deletePaymentMethod(id: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/methods/${id}`, { headers: this.getHeaders() });
  }
}
