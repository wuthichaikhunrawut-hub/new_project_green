import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserSubscriptionsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/subscriptions';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getMySubscription(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`, { headers: this.getHeaders() });
  }

  getMyUsage(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my/usage`, { headers: this.getHeaders() });
  }

  getMyPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my/payments`, { headers: this.getHeaders() });
  }

  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/plans`, { headers: this.getHeaders() });
  }

  cancelSubscription(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/my/cancel`, { headers: this.getHeaders() });
  }
}
