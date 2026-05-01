import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface GreenCriteriaMaster {
  id: number;
  category_number: number;
  criteria_code: string;
  criteria_name: string;
  max_score: number;
  description: string;
}

export interface AssessmentDetail {
  id?: number;
  criteria?: GreenCriteriaMaster;
  self_score?: number;
  applicant_comment?: string;
  assessor_score?: number;
  auditor_comment?: string;
  evidence_files?: any[];
}

export interface CertificationRequest {
  id?: number;
  status: string;
  notes?: string;
  details?: AssessmentDetail[];
  total_score?: number;
  certified_level?: string;
  assessment_year?: number;
  submitted_at?: string;
  updated_at?: string;
  organization?: any;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private apiUrl = 'http://localhost:3001/assessments';
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let orgId = '';
    let role = '';
    let userId = '';
    if (isPlatformBrowser(this.platformId)) {
      try {
        const currentUser = this.authService.getUser();
        const storedOrg = localStorage.getItem('currentOrg');
        const org = storedOrg && storedOrg !== 'undefined' ? JSON.parse(storedOrg) : {};
        orgId = org?.id ? String(org.id) : '';
        role = currentUser?.role ? String(currentUser.role) : '';
        userId = currentUser?.id ? String(currentUser.id) : '';
      } catch (e) {
        console.error('Error retrieving auth info in getHeaders', e);
      }
    }
    let headers = new HttpHeaders();
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('access_token') : '';
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (orgId) headers = headers.set('x-org-id', orgId);
    if (role) headers = headers.set('x-user-role', role);
    if (userId) headers = headers.set('x-user-id', userId);
    return headers;
  }

  getRequests(): Observable<CertificationRequest[]> {
    return this.http.get<CertificationRequest[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getRequestById(id: string): Observable<CertificationRequest> {
    return this.http.get<CertificationRequest>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createRequest(request: CertificationRequest): Observable<CertificationRequest> {
    return this.http.post<CertificationRequest>(this.apiUrl, request, { headers: this.getHeaders() });
  }

  updateRequest(id: string, request: Partial<CertificationRequest>): Observable<CertificationRequest> {
    return this.http.patch<CertificationRequest>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() });
  }

  deleteRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
