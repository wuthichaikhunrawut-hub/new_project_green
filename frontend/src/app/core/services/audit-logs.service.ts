import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: string;
  action: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    username?: string;
    email: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private http = inject(HttpClient);
  // URL to web api
  private apiUrl = 'http://localhost:3001/audit-logs';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.apiUrl, { headers: this.getHeaders() });
  }
}
