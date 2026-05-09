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
  private apiUrl = 'http://localhost:3001/gemini/ocr';

  constructor(private http: HttpClient) {}

  /**
   * Upload a bill image to the backend for AI scanning.
   * @param file The image file selected by the user
   */
  uploadBill(file: File): Observable<BillScanResult> {
    const formData = new FormData();
    formData.append('file', file);
    // Backend endpoint is /gemini/ocr
    return this.http.post<BillScanResult>(this.apiUrl, formData);
  }
}
