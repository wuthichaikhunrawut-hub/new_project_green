import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  ASSESSMENT = 'ASSESSMENT',
  ACCOUNT = 'ACCOUNT',
  DEADLINE = 'DEADLINE',
  REQUEST = 'REQUEST',
  URGENT = 'URGENT',
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
  recipient_id: number;
  sender_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`).pipe(
      tap((count) => this.unreadCountSubject.next(count))
    );
  }

  sendNotification(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_id: number;
    link?: string;
  }): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, data);
  }

  sendBulkNotification(data: {
    title: string;
    message: string;
    type: NotificationType;
    recipient_ids: number[];
    link?: string;
  }): Observable<Notification[]> {
    return this.http.post<Notification[]>(`${this.apiUrl}/bulk`, data);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      })
    );
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  updateUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  getAllSystemNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/system/history`);
  }
}
