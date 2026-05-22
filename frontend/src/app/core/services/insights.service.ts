import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/gemini';

  getExecutiveSummary(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/executive-summary`, data);
  }

  getRecommendations(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/recommendations`, data);
  }
}
