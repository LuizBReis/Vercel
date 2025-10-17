// src/app/services/user.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Skill } from './skill';
import { Job, JobApplication } from './job';

// --- INTERFACES ATUALIZADAS ---
export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  employmentType: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface FreelancerProfileModel {
  id: string;
  description?: string;
  skills: Skill[];
  workExperiences: WorkExperience[];
}

export interface ClientProfileModel {
  id: string;
  companyName?: string;
  location?: string;
  description?: string;
}

// A interface UserProfile agora reflete a estrutura aninhada da API
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
  freelancerProfile: FreelancerProfileModel | null;
  clientProfile: ClientProfileModel | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';
  private profileApiUrl = 'http://localhost:3000/api/profile';

  constructor(private http: HttpClient) { }

  getUserProfile(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
  }

  updateMyProfile(profileData: any): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.profileApiUrl}/me`, profileData);
  }

  addSkill(skillName: string): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.profileApiUrl}/me/skills`, { skillName });
  }

  removeSkill(skillName: string): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.profileApiUrl}/me/skills`, { body: { skillName } });
  }

  addWorkExperience(experienceData: any): Observable<WorkExperience> {
    return this.http.post<WorkExperience>(`${this.profileApiUrl}/me/experience`, experienceData);
  }

  updateWorkExperience(expId: string, experienceData: any): Observable<any> {
    return this.http.patch(`${this.profileApiUrl}/me/experience/${expId}`, experienceData);
  }

  deleteWorkExperience(expId: string): Observable<any> {
    return this.http.delete(`${this.profileApiUrl}/me/experience/${expId}`);
  }

  deleteMyAccount(): Observable<any> {
    return this.http.delete(`${this.profileApiUrl}/me`);
  }

  getMyPostedJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.profileApiUrl}/me/jobs`);
  }

  getMyApplications(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.profileApiUrl}/me/applications`);
  }
}