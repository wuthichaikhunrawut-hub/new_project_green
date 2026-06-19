import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organization } from '../models/organization.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private apiUrl = `${environment.apiUrl}/organizations`;

  constructor(private http: HttpClient) {}

  getOrganization(id: number): Observable<Organization> {
    return this.http.get<Organization>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl);
  }

  updateOrganization(id: number, data: Partial<Organization>): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/${id}`, data);
  }

  create(data: Partial<Organization>): Observable<Organization> {
    return this.http.post<Organization>(this.apiUrl, data);
  }
}
