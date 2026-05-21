import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface CarbonLog {
  id?: string;
  date: string;
  type: string;
  amount: number;
  unit: string;
  emission: number;
  source: string;
  evidence_url?: string;
  org_unit_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CarbonService {
  private apiUrl = 'http://localhost:3001/carbon-logs';
  private geminiUrl = 'http://localhost:3001/gemini/ocr';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
      const org = JSON.parse(localStorage.getItem('currentOrg') || '{}') as {
        id?: number | string;
      };
      if (org.id) {
        headers = headers.set('x-org-id', String(org.id));
      }
    }
    return headers;
  }

  // ดึงข้อมูลทั้งหมด
  getLogs(): Observable<CarbonLog[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(data => data.map(item => ({
        id: String(item.id),
        date: `${item.year}-${String(item.month).padStart(2, '0')}-01`,
        type: item.activity_type,
        amount: item.usage_amount,
        unit: item.activity_type === 'Electricity' ? 'kWh' : (item.activity_type === 'Water' ? 'm3' : 'Litre'),
        emission: item.total_emission,
        source: item.data_source,
        evidence_url: item.evidence_url,
        org_unit_id: item.org_unit_id
      })))
    );
  }

  // ยิง API จริง
  addLog(log: CarbonLog): Observable<CarbonLog> {
    const dDate = new Date(log.date);
    const payload = {
      activity_type: log.type,
      month: dDate.getMonth() + 1,
      year: dDate.getFullYear(),
      usage_amount: log.amount,
      total_emission: log.emission,
      data_source: log.source,
      evidence_url: log.evidence_url,
      org_unit_id: log.org_unit_id
    };
    return this.http.post<CarbonLog>(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  deleteLog(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateLog(
    id: string,
    payload: Partial<{
      activity_type: string;
      month: number;
      year: number;
      usage_amount: number;
      total_emission: number;
      emission_factor_id: number;
      evidence_url: string;
      data_source: string;
    }>,
  ): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  // ยิงไปหา Gemini API ใน Backend
  scanBill(image: File): Observable<Partial<CarbonLog>> {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post<Partial<CarbonLog>>(this.geminiUrl, formData, { headers: this.getHeaders() });
  }

  // อัพโหลดไฟล์ไปที่ Supabase ผ่าน Backend
  uploadFile(file: File, folder: string = 'evidence'): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const uploadUrl = 'http://localhost:3001/uploads';
    return this.http.post<{ url: string }>(`${uploadUrl}?folder=${folder}`, formData, { headers: this.getHeaders() });
  }
}