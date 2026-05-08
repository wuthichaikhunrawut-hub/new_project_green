import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { of, Observable, catchError, map } from 'rxjs';
import { GreenCriteria } from '../models/green-office.model';
import { MOCK_CRITERIA } from '../mock-data/mock-green-office';

@Injectable({ providedIn: 'root' })
export class GreenOfficeService {
  private apiUrl = 'http://localhost:3001/admin/green-criteria';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private getHeaders(): { [header: string]: string } {
    let orgId = '';
    if (isPlatformBrowser(this.platformId)) {
      const org = JSON.parse(localStorage.getItem('currentOrg') || '{}');
      orgId = org.id ? org.id.toString() : '';
    }
    return { 'x-org-id': orgId };
  }

  // ดึงเกณฑ์ทั้งหมด
  getCriteriaList(): Observable<GreenCriteria[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        // Transform backend data to frontend format
        map((criteria: any[]) => criteria.map((item: any) => ({
          id: item.id,
          category: item.category_number,
          code: item.criteria_code,
          name: item.criteria_name,
          maxScore: item.max_score,
          currentScore: 0,
          status: 'Pending' as const
        }))),
        // Fallback to MOCK data if backend is not ready yet to prevent crash
        catchError(() => of(MOCK_CRITERIA))
      );
  }

  // อัปเดตคะแนนประเมินตนเอง
  updateScore(criteriaId: number, score: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${criteriaId}/score`, { score }, { headers: this.getHeaders() })
      .pipe(
        catchError(() => {
           console.log('Mocking save since API failed');
           return of(true);
        })
      );
  }

  // จำลองการอัปโหลดไฟล์หลักฐาน
  uploadEvidence(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string>(`${this.apiUrl}/upload`, formData, { headers: this.getHeaders() })
      .pipe(
        catchError(() => of('https://fake-storage.com/' + file.name))
      );
  }
}