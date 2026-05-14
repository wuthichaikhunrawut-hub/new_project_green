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
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getMySubscription(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`, { headers: this.getHeaders() });
  }

  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/plans`, { headers: this.getHeaders() });
  }
}
