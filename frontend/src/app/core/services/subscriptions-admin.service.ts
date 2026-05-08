import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  description: string;
  price_per_month: number;
  max_users: number;
  max_locations: number;
  has_ai_scan: boolean;
  has_green_office: boolean;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  reference_number: string;
  notes: string;
  created_at: string;
  organization?: { id: string; name: string };
  plan?: SubscriptionPlan | null;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsAdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3001/admin/subscriptions';
  private headers = () => new HttpHeaders({ 'Content-Type': 'application/json' });

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/plans`, { headers: this.headers() });
  }
  createPlan(data: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(`${this.baseUrl}/plans`, data, { headers: this.headers() });
  }
  updatePlan(id: string, data: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.put<SubscriptionPlan>(`${this.baseUrl}/plans/${id}`, data, { headers: this.headers() });
  }
  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/plans/${id}`, { headers: this.headers() });
  }
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`, { headers: this.headers() });
  }
  updateInvoiceStatus(id: string, status: string): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.baseUrl}/invoices/${id}/status`, { status }, { headers: this.headers() });
  }
}
