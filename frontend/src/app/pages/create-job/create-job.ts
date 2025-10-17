import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobService } from '../../services/job';

// Imports do Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './create-job.html',
  styleUrl: './create-job.scss'
})
export class CreateJob {
  createJobForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router
  ) {
    this.createJobForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      budget: [null, [Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.createJobForm.valid) {
      this.jobService.createJob(this.createJobForm.value).subscribe({
        next: (newJob) => {
          console.log('Vaga criada com sucesso!', newJob);
          // Redireciona para o dashboard para ver a nova vaga na lista
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Erro ao criar vaga:', err);
          // Aqui você poderia mostrar uma notificação de erro para o usuário
        }
      });
    }
  }

}
