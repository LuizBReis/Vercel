import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common'; // Adicionei os Pipes
import { RouterLink } from '@angular/router';

// Imports dos nossos Serviços e Interfaces (CORRIGIDOS)
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user';
import { Job, JobApplication } from '../../services/job';
import { ApplicationService } from '../../services/application';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [ 
    CommonModule, 
    RouterLink, 
    MatCardModule, 
    MatProgressSpinnerModule, 
    DatePipe,       // Adicionado para o pipe | date funcionar
    TitleCasePipe,
    MatDividerModule   // Adicionado para o pipe | titlecase funcionar
  ],
  templateUrl: './my-jobs.html',
  styleUrls: ['./my-jobs.scss']
})
export class MyJobs implements OnInit {
  userRole: string | null = null;
  isLoading = true;
  postedJobs: Job[] = [];
  applications: JobApplication[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private applicationService: ApplicationService, // 3. Injete
    private snackBar: MatSnackBar // 4. Injete
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();

    if (this.userRole === 'CLIENT') {
      this.userService.getMyPostedJobs().subscribe({
        next: (jobs) => {
          this.postedJobs = jobs;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar vagas postadas:', err);
          this.isLoading = false;
        }
      });
    } 
    else if (this.userRole === 'FREELANCER') {
      this.userService.getMyApplications().subscribe({
        next: (apps) => {
          this.applications = apps;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar candidaturas:', err);
          this.isLoading = false;
        }
      });
    }
  }

  // --- 5. NOVA FUNÇÃO PARA CANCELAR CANDIDATURA ---
  onCancelApplication(applicationId: string): void {
    if (confirm('Tem certeza de que deseja cancelar sua candidatura?')) {
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          // Remove a candidatura da lista local para atualizar a tela
          this.applications = this.applications.filter(app => app.id !== applicationId);
          this.snackBar.open('Candidatura cancelada com sucesso.', 'Fechar', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Erro ao cancelar candidatura.', 'Fechar', { duration: 3000, panelClass: 'error-snackbar' });
          console.error(err);
        }
      });
    }
  }
}