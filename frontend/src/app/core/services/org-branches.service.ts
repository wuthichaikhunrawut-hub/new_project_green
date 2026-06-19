import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface OrgBranch {
  id?: number;
  org_id: number;
  unit_name: string;
  parent_unit_id?: number | null;
  unit_type?: string;
  area?: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrgBranchesService {
  private apiUrl = `${environment.apiUrl}/organizations`;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {

      }
    }
    return headers;
  }

  getBranches(orgId: number): Observable<OrgBranch[]> {
    return this.http.get<OrgBranch[]>(`${this.apiUrl}/${orgId}/units`, { headers: this.getHeaders() });
  }

  createBranch(orgId: number, data: Partial<OrgBranch>): Observable<OrgBranch> {
    return this.http.post<OrgBranch>(`${this.apiUrl}/${orgId}/units`, data, { headers: this.getHeaders() });
  }

  updateBranch(unitId: number, data: Partial<OrgBranch>): Observable<OrgBranch> {
    return this.http.patch<OrgBranch>(`${this.apiUrl}/units/${unitId}`, data, { headers: this.getHeaders() });
  }

  deleteBranch(unitId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/units/${unitId}`, { headers: this.getHeaders() });
  }
}
