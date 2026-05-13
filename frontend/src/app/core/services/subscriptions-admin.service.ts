import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feature {
  id: number;
  feature_code: string;
  feature_name: string;
  description: string;
}

export interface SubscriptionPlan {
  id: number;
  plan_name: string;
  description: string;
  price_per_month: number;
  max_users: number;
  max_locations: number;
  is_active: boolean;
  features?: Feature[];
}

export interface Invoice {
  id: number;
  amount: number;
  status: string;
  reference_number: string;
  notes: string;
  created_at: string;
  organization?: { id: number; name: string };
  plan?: SubscriptionPlan | null;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsAdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3001/admin/subscriptions';

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/plans`);
  }
  getFeatures(): Observable<Feature[]> {
    return this.http.get<Feature[]>(`${this.baseUrl}/features`);
  }
  createFeature(data: Partial<Feature>): Observable<Feature> {
    return this.http.post<Feature>(`${this.baseUrl}/features`, data);
  }
  updateFeature(id: number, data: Partial<Feature>): Observable<Feature> {
    return this.http.put<Feature>(`${this.baseUrl}/features/${id}`, data);
  }
  deleteFeature(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/features/${id}`);
  }
  createPlan(data: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(`${this.baseUrl}/plans`, data);
  }
  updatePlan(id: number, data: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.put<SubscriptionPlan>(`${this.baseUrl}/plans/${id}`, data);
  }
  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/plans/${id}`);
  }
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`);
  }
  updateInvoiceStatus(id: number, status: string): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.baseUrl}/invoices/${id}/status`, { status });
  }
}
