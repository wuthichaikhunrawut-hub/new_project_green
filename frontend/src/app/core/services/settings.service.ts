import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/settings`;

  private getHeaders(): HttpHeaders {
    let token = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('access_token');
    }
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {

    }
    return headers;
  }

  getSettings(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put<any>(this.apiUrl, settings, { headers: this.getHeaders() });
  }
}
