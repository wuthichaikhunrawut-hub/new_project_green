import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserSubscriptionsService {
  private http = inject(HttpClient);
  public quotaUpdated$ = new Subject<void>();
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  private platformId = inject(PLATFORM_ID);

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {

      }
    }
    return headers;
  }

  getMySubscription(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`, { headers: this.getHeaders() });
  }

  getMyUsage(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my/usage`, { headers: this.getHeaders() });
  }

  getMyQuotas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my/quotas`, { headers: this.getHeaders() });
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

  subscribeToPlan(planId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/my/subscribe`, { planId }, { headers: this.getHeaders() });
  }
}
