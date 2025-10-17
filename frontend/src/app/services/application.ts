import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = 'http://localhost:3000/api/applications';

  constructor(private http: HttpClient) { }

  updateStatus(applicationId: string, status: string): Observable<any> {
    const url = `${this.apiUrl}/${applicationId}/status`;
    return this.http.patch(url, { status });
  }

    // --- NOVA FUNÇÃO PARA DELETAR UMA CANDIDATURA ---
  deleteApplication(applicationId: string): Observable<any> {
    const url = `${this.apiUrl}/${applicationId}`;
    return this.http.delete(url);
  }
}