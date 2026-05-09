import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { User } from '../models/user.model';

export interface AuthResponse {
  access_token: string;
  user: User;
  organization: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3001/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap(response => this.handleAuthResponse(response)));
  }

  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload)
      .pipe(tap(response => this.handleAuthResponse(response)));
  }

  registerAssessor(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/assessor`, payload)
      .pipe(tap(response => this.handleAuthResponse(response)));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentOrg');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }

  getUser(): User | null {
    return this.currentUserValue;
  }

  getOrganizationId(): number | null {
    if (isPlatformBrowser(this.platformId)) {
      const org = JSON.parse(localStorage.getItem('currentOrg') || '{}');
      return org.org_id || org.id || null;
    }
    return null;
  }

  private handleAuthResponse(response: AuthResponse) {
    if (response && response.access_token) {
      // Enrich user with organization name for sidebar display
      const enrichedUser = {
        ...response.user,
        organizationName: response.organization?.name || response.user?.username || ''
      };
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(enrichedUser));
      localStorage.setItem('currentOrg', JSON.stringify(response.organization));
      this.currentUserSubject.next(enrichedUser);
    }
  }
}