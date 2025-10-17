// src/app/services/job.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// --- INTERFACES CENTRALIZADAS ---
export interface AuthorUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface JobAuthor {
  id: string; // ID do ClientProfile
  companyName?: string;
  user: AuthorUser;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget?: number;
  author: JobAuthor;
  hasApplied?: boolean;
}

export interface JobApplication {
  id: string;
  status: string;
  createdAt: Date;
  applicant: AuthorUser;
  job: Job;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = 'http://localhost:3000/api/jobs';

  constructor(private http: HttpClient) { }

  getJobs(filters: any): Observable<Job[]> {
    let params = new HttpParams();
    if (filters.search) params = params.append('search', filters.search);
    if (filters.minBudget) params = params.append('minBudget', filters.minBudget);
    if (filters.maxBudget) params = params.append('maxBudget', filters.maxBudget);
    return this.http.get<Job[]>(this.apiUrl, { params });
  }

  getJobById(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${id}`);
  }
  
  createJob(jobData: any): Observable<Job> {
    return this.http.post<Job>(this.apiUrl, jobData);
  }

  applyToJob(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${jobId}/apply`, {});
  }

  updateJob(jobId: string, jobData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${jobId}`, jobData);
  }

  deleteJob(jobId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${jobId}`);
  }

  getJobApplicants(jobId: string, filters: any): Observable<JobApplication[]> {
    let params = new HttpParams();
    if (filters.skill) params = params.append('skill', filters.skill);
    return this.http.get<JobApplication[]>(`${this.apiUrl}/${jobId}/applications`, { params });
  }
}