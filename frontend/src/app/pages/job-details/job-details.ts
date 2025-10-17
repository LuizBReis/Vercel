import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router'; // ActivatedRoute para ler a URL
import { JobService, Job, JobApplication } from '../../services/job'; // Nosso serviço de jobs
import { AuthService } from '../../auth/auth.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { ApplicationService } from '../../services/application';
import { debounceTime, switchMap, startWith } from 'rxjs/operators';
import { MessageService } from '../../services/message';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { JobForm } from '../../components/job-form/job-form';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-job-details',
  imports: [
    CommonModule, 
    RouterLink,
    MatCardModule, 
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,       // Adicionei os Pipes aqui também
    TitleCasePipe,
    MatListModule,
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule
  ],
  templateUrl: './job-details.html',
  styleUrls: ['./job-details.scss']
})
export class JobDetails implements OnInit {
  job: Job | null = null;
  isLoading = true;
  isAuthor = false;
  userRole: string | null = null;
  // Novas propriedades para o filtro
  applicantFilterControl = new FormControl('');
  applicants$: Observable<JobApplication[]> = of([]);

  constructor(
    private route: ActivatedRoute, // Injeta o serviço de rotas
    private jobService: JobService,
    private authService: AuthService,
    public dialog: MatDialog,
    private router: Router,
    private applicationService: ApplicationService, // 2. Injete o novo serviço
    private messageService: MessageService, // 2. Injete o serviço de mensagens
    private snackBar: MatSnackBar
  ) {}

 ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    const jobId = this.route.snapshot.paramMap.get('id');
    
    if (jobId) {
      this.jobService.getJobById(jobId).subscribe({
        next: (data) => {
          this.job = data;
          this.isLoading = false;
          this.isAuthor = this.authService.getUserId() === this.job?.author?.user?.id;

          if (this.isAuthor) {
            this.applicants$ = this.applicantFilterControl.valueChanges.pipe(
              startWith(this.applicantFilterControl.value), // Começa com o valor atual (vazio)
              debounceTime(300),
              // CORREÇÃO 2: Adiciona o tipo 'string'
              switchMap((skill: string | null) => this.jobService.getJobApplicants(jobId, { skill: skill || '' }))
            );
          }
        },
        error: (err) => { console.error('Erro ao buscar vaga:', err); this.isLoading = false; }
      });
    }
  }

  // 4. Nova função para lidar com a candidatura
  onApply(): void {
    if (!this.job) return;

    this.jobService.applyToJob(this.job.id).subscribe({
      next: () => {
        alert('Candidatura enviada com sucesso!');
        // === CORREÇÃO AQUI ===
        // Atualiza o estado local para que a tela mude instantaneamente
        if (this.job) {
          this.job.hasApplied = true;
        }
      },
      error: (err) => {
        alert(`Erro: ${err.error.message}`);
      }
    });
  }
  // --- 3. NOVA FUNÇÃO PARA ABRIR O DIALOG DE EDIÇÃO ---
  openEditJobDialog(): void {
    if (!this.job) return;

    const dialogRef = this.dialog.open(JobForm, {
      width: '600px',
      data: this.job // Passa os dados da vaga atual para o formulário
    });

    dialogRef.afterClosed().subscribe(result => {
      // Se o usuário salvou (result não é undefined)
      if (result) {
        this.jobService.updateJob(this.job!.id, result).subscribe({
          next: () => {
            // Atualiza os dados na tela instantaneamente
            this.job = { ...this.job, ...result };
            alert('Vaga atualizada com sucesso!');
          },
          error: (err) => console.error('Erro ao atualizar vaga:', err)
        });
      }
    });
  }

  // --- 3. NOVA FUNÇÃO PARA DELETAR VAGA ---
  onDeleteJob(): void {
    if (!this.job) return;

    if (confirm('Tem certeza de que deseja excluir esta vaga? Esta ação não pode ser desfeita.')) {
      this.jobService.deleteJob(this.job.id).subscribe({
        next: () => {
          alert('Vaga excluída com sucesso!');
          // Redireciona o usuário para o dashboard, pois a página atual não existe mais
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Erro ao excluir vaga:', err);
          alert('Ocorreu um erro ao excluir a vaga.');
        }
      });
    }
  }

 // --- MÉTODO ATUALIZADO ---
updateApplicationStatus(applicationId: string, newStatus: 'SHORTLISTED' | 'REJECTED'): void { // ✅ MUDANÇA AQUI
  this.applicationService.updateStatus(applicationId, newStatus).subscribe({
    next: () => {
      this.snackBar.open('Status do candidato atualizado!', 'Fechar', { duration: 3000 });
      // Força a atualização da lista de candidatos
      this.applicantFilterControl.setValue(this.applicantFilterControl.value);
    },
    error: (err: any) => {
      this.snackBar.open('Erro ao atualizar status.', 'Fechar', { duration: 3000, panelClass: 'error-snackbar' });
    }
  });
}
  onStartConversation(applicationId: string): void {
    this.messageService.startConversation(applicationId).subscribe({
      next: (conversation) => {
        console.log('Conversa iniciada ou encontrada:', conversation);
        // Futuramente, redirecionaremos para a página de chat
        this.router.navigate(['/messages', conversation.id]);
        this.snackBar.open(`Conversa iniciada! ID: ${conversation.id}`, 'Fechar', { duration: 5000 });
      },
      error: (err) => {
        console.error('Erro ao iniciar conversa:', err);
        this.snackBar.open('Erro ao iniciar conversa.', 'Fechar', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }
  
}

