import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrgBranch {
  id?: number;
  org_id: number;
  unit_name: string;
  parent_unit_id?: number | null;
  unit_type?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrgBranchesService {
  private apiUrl = 'http://localhost:3001/organizations';

  constructor(private http: HttpClient) {}

  getBranches(orgId: number): Observable<OrgBranch[]> {
    return this.http.get<OrgBranch[]>(`${this.apiUrl}/${orgId}/units`);
  }

  createBranch(orgId: number, data: Partial<OrgBranch>): Observable<OrgBranch> {
    return this.http.post<OrgBranch>(`${this.apiUrl}/${orgId}/units`, data);
  }

  updateBranch(unitId: number, data: Partial<OrgBranch>): Observable<OrgBranch> {
    return this.http.patch<OrgBranch>(`${this.apiUrl}/units/${unitId}`, data);
  }

  deleteBranch(unitId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/units/${unitId}`);
  }
}
