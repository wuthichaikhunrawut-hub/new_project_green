import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AssessmentCriteria as GreenCriteria } from '../models/assessment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GreenOfficeService {
  private apiUrl = `${environment.apiUrl}/green-office`;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private getHeaders(): { [header: string]: string } {
    const headers: { [header: string]: string } = {};
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {

      }
      const org = JSON.parse(localStorage.getItem('currentOrg') || '{}');
      if (org.id) {
        headers['x-org-id'] = org.id.toString();
      }
    }
    return headers;
  }

  // ดึงเกณฑ์ทั้งหมด
  getCriteriaList(): Observable<GreenCriteria[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        // Transform backend data to frontend format
        map((criteria: any[]) => criteria.map((item: any) => ({
          id: item.id,
          category_number: item.category_number,
          criteria_code: item.criteria_code,
          criteria_name: item.criteria_name,
          max_score: item.max_score,
          current_score: item.current_score || 0,
          status: 'Pending' as const
        }))),
        // If backend is not available, we throw error so caller can handle
        catchError(err => throwError(() => err))
      );
  }

  // อัปเดตคะแนนประเมินตนเอง
  updateScore(criteriaId: number, score: number): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/${criteriaId}/score`, { score }, { headers: this.getHeaders() })
      .pipe(
        map(res => res.success || true),
        catchError(err => throwError(() => err))
      );
  }

  // อัปโหลดไฟล์หลักฐาน
  uploadEvidence(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, { headers: this.getHeaders() })
      .pipe(
        map(res => res.url || 'https://fake-storage.com/' + file.name),
        catchError(err => throwError(() => err))
      );
  }
}