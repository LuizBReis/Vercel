import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// A interface Skill fica melhor aqui
export interface Skill {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private apiUrl = 'http://localhost:3000/api/skills';

  constructor(private http: HttpClient) { }

  getSuggestedSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/suggestions`);
  }
}