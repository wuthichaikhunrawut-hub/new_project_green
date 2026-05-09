import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/uploads';

  uploadFile(
    file: File, 
    folder: string = 'evidence', 
    metadata?: { assessmentDetailId?: number; userId?: number; carbonLogId?: number; category?: string }
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams().set('folder', folder);
    if (metadata?.assessmentDetailId) params = params.set('assessmentDetailId', metadata.assessmentDetailId.toString());
    if (metadata?.userId) params = params.set('userId', metadata.userId.toString());
    if (metadata?.carbonLogId) params = params.set('carbonLogId', metadata.carbonLogId.toString());
    if (metadata?.category) params = params.set('category', metadata.category);

    return this.http.post<any>(this.apiUrl, formData, { params }).pipe(
      catchError(err => {
        console.error('❌ Upload service error:', err);
        throw err;
      })
    );
  }

  getFiles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      catchError(err => {
        console.error('❌ Get files service error:', err);
        throw err;
      })
    );
  }

  updateFileCategory(id: number, category: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { category }).pipe(
      catchError(err => {
        console.error('❌ Update category service error:', err);
        throw err;
      })
    );
  }

  deleteFile(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error('❌ Delete service error:', err);
        throw err;
      })
    );
  }
}
