import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  ApproveAssessmentPayload,
  AssessorAssessment,
  AssessorAssignmentItem,
  AssessorDashboardResponse,
  OrgCarbonSummary,
  RequestRevisionPayload,
  SaveEvidenceReviewPayload,
} from '../models/assessor.model';

@Injectable({ providedIn: 'root' })
export class AssessorService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}/assessor`;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      const user = this.authService.getUser();

      if (user?.role) headers = headers.set('x-user-role', String(user.role));
      if (user?.id) headers = headers.set('x-user-id', String(user.id));
    }
    return headers;
  }

  getDashboard(): Observable<AssessorDashboardResponse> {
    return this.http.get<AssessorDashboardResponse>(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders(),
    });
  }

  getAssignments(): Observable<AssessorAssignmentItem[]> {
    return this.http.get<AssessorAssignmentItem[]>(`${this.apiUrl}/assignments`, {
      headers: this.getHeaders(),
    });
  }

  getHistory(): Observable<AssessorAssignmentItem[]> {
    return this.http.get<AssessorAssignmentItem[]>(`${this.apiUrl}/history`, {
      headers: this.getHeaders(),
    });
  }

  getCarbonSummary(orgId: number): Observable<OrgCarbonSummary> {
    return this.http.get<OrgCarbonSummary>(
      `${this.apiUrl}/organizations/${orgId}/carbon-summary`,
      { headers: this.getHeaders() },
    );
  }

  getAssessment(id: number): Observable<AssessorAssessment> {
    return this.http.get<AssessorAssessment>(`${this.apiUrl}/assessments/${id}`, {
      headers: this.getHeaders(),
    });
  }

  saveEvidenceReview(
    id: number,
    payload: SaveEvidenceReviewPayload,
  ): Observable<AssessorAssessment> {
    return this.http.post<AssessorAssessment>(
      `${this.apiUrl}/assessments/${id}/evidence-review`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  approve(
    id: number,
    payload: ApproveAssessmentPayload,
  ): Observable<AssessorAssessment> {
    return this.http.patch<AssessorAssessment>(
      `${this.apiUrl}/assessments/${id}/approve`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  requestRevision(
    id: number,
    payload: RequestRevisionPayload,
  ): Observable<AssessorAssessment> {
    return this.http.patch<AssessorAssessment>(
      `${this.apiUrl}/assessments/${id}/request-revision`,
      payload,
      { headers: this.getHeaders() },
    );
  }

  updateCertificate(
    id: number,
    payload: {
      certificate_no?: string;
      issued_at?: string;
      expired_at?: string;
      certificate_url?: string;
    }
  ): Observable<AssessorAssessment> {
    return this.http.patch<AssessorAssessment>(
      `${this.apiUrl}/assessments/${id}/certificate`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  getCalendar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/calendar`, {
      headers: this.getHeaders(),
    });
  }
}
