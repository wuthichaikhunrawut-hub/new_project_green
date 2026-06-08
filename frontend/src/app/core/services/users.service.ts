import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface Role {
  id: number;
  role_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/users`;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      const currentUser = this.authService.getUser();
      const orgId = this.authService.getOrganizationId();

      if (token) headers = headers.set('Authorization', `Bearer ${token}`);
      if (orgId) headers = headers.set('x-org-id', String(orgId));
      if (currentUser?.role) headers = headers.set('x-user-role', String(currentUser.role));
      if (currentUser?.id) headers = headers.set('x-user-id', String(currentUser.id));
    }
    return headers;
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`, { headers: this.getHeaders() });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData, { headers: this.getHeaders() });
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

}
