import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BillScanResult {
  type: string;
  amount: number;
  unit: string;
  date: string;
  confidence: number;
  rawText: string;

}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiUrl = 'http://localhost:3001/gemini';

  constructor(private http: HttpClient) {}

  /**
   * Upload a bill image to the backend for AI scanning.
   * @param file The image file selected by the user
   */
  uploadBill(file: File): Observable<BillScanResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BillScanResult>(`${this.apiUrl}/ocr`, formData);
  }

  validateEvidence(file: File, categoryId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId);
    return this.http.post<any>(`${this.apiUrl}/evidence-validation`, formData);
  }
}
