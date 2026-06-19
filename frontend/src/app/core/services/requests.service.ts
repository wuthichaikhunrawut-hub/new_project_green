import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Assessment } from '../models/assessment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private apiUrl = `${environment.apiUrl}/assessments`;
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      const currentUser = this.authService.getUser();
      const orgId = this.authService.getOrganizationId();


      if (orgId) headers = headers.set('x-org-id', String(orgId));
      if (currentUser?.role) headers = headers.set('x-user-role', String(currentUser.role));
      if (currentUser?.id) headers = headers.set('x-user-id', String(currentUser.id));
    }
    
    return headers;
  }

  getRequests(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getRequestById(id: number | string): Observable<Assessment> {
    return this.http.get<Assessment>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createRequest(request: Partial<Assessment>): Observable<Assessment> {
    return this.http.post<Assessment>(this.apiUrl, request, { headers: this.getHeaders() });
  }

  updateRequest(id: number | string, request: Partial<Assessment>): Observable<Assessment> {
    return this.http.patch<Assessment>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() });
  }

  deleteRequest(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
