// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private profileApiUrl = 'http://localhost:3000/api/profile';

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  getProfile(): Observable<any> {
    // Corrigido para usar a variável
    return this.http.get(`${this.profileApiUrl}/me`);
  }

  getUserRole(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      return null;
    }
  }

  getUserId(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.profileApiUrl}/me/change-password`, passwordData);
  }
  
  changeEmail(emailData: any): Observable<any> {
    return this.http.post(`${this.profileApiUrl}/me/change-email`, emailData);
  }
}