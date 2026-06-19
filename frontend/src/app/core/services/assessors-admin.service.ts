import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AssessorUser {
  id: string;
  username: string;
  email: string;
  bio: string;
  assessor_verified: boolean;
  is_active: boolean;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  assessor_profile?: {
    license_number: string;
    years_experience: number;
    education_background: string;
    verification_status: string;
    qualification_file_url?: string;
    verified_at?: string;
    verified_by_id?: number;
  };
  bank_accounts?: any[];
}

@Injectable({ providedIn: 'root' })
export class AssessorsAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;
  private adminApiUrl = `${environment.apiUrl}/assessor-admin`;
  private headers = () => new HttpHeaders({ 'Content-Type': 'application/json' });

  getAssessors(): Observable<AssessorUser[]> {
    return this.http.get<AssessorUser[]>(`${this.apiUrl}?role=ASSESSOR`, { headers: this.headers() });
  }

  verifyAssessor(id: string, verified: boolean): Observable<AssessorUser> {
    return this.http.put<AssessorUser>(`${this.apiUrl}/${id}`, { assessor_verified: verified }, { headers: this.headers() });
  }

  suspendAssessor(id: string, isActive: boolean): Observable<AssessorUser> {
    return this.http.put<AssessorUser>(`${this.apiUrl}/${id}`, { is_active: isActive }, { headers: this.headers() });
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/dashboard`, { headers: this.headers() });
  }

  assignAssessor(assessmentId: number, assessorId: number): Observable<any> {
    return this.http.post<any>(`${this.adminApiUrl}/assignments`, { assessmentId, assessorId }, { headers: this.headers() });
  }

  processPayout(assessorId: number, amount: number): Observable<any> {
    return this.http.post<any>(`${this.adminApiUrl}/payouts`, { assessorId, amount }, { headers: this.headers() });
  }
}
