import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gemini`;

  sendMessage(message: string): Observable<string> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}/chat`, { message }).pipe(
      map(response => response.reply)
    );
  }
}