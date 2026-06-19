import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gemini`;
  private platformId = inject(PLATFORM_ID);

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {

      }
    }
    return headers;
  }

  getExecutiveSummary(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/executive-summary`, data, { headers: this.getHeaders() });
  }

  getRecommendations(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/recommendations`, data, { headers: this.getHeaders() });
  }
}
