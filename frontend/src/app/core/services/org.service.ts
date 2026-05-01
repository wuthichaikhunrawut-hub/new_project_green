import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private apiUrl = 'http://localhost:3001/organizations';

  constructor(private http: HttpClient) {}

  getOrganization(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  updateOrganization(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
