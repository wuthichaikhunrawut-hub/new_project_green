import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
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
}

@Injectable({ providedIn: 'root' })
export class CarbonService {
  private apiUrl = 'http://localhost:3001/carbon-logs';
  private geminiUrl = 'http://localhost:3001/gemini/ocr';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): { [header: string]: string } {
    let orgId = '';
    if (isPlatformBrowser(this.platformId)) {
      const org = JSON.parse(localStorage.getItem('currentOrg') || '{}');
      orgId = org.id ? org.id.toString() : '';
    }
    return { 'x-org-id': orgId };
  }

  // ดึงข้อมูลทั้งหมด
  getLogs(): Observable<CarbonLog[]> {
    return this.http.get<CarbonLog[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // จำลองการบันทึกข้อมูล -> เปลี่ยนเป็นยิง API จริง
  addLog(log: CarbonLog): Observable<CarbonLog> {
    return this.http.post<CarbonLog>(this.apiUrl, log, { headers: this.getHeaders() });
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