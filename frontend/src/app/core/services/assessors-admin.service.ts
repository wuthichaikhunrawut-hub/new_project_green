import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3001/users';
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
}
