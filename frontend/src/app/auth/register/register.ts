import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
registerForm: FormGroup;

// Injetamos o FormBuilder no construtor
constructor(
  private fb: FormBuilder, 
  private authService: AuthService, 
  private router: Router, 
  private snackBar: MatSnackBar
) {
  // Criamos a estrutura do formulário
this.registerForm = this.fb.group({
      role: ['FREELANCER', [Validators.required]],
      // Campos do Freelancer
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      // Campos do Cliente (iniciam sem validação)
      companyName: [''],
      location: [''],
      // Campos comuns
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // ADICIONE ESTE GETTER ABAIXO DO CONSTRUTOR
  get roleControl(): FormControl {
    return this.registerForm.get('role') as FormControl;
  }

    // 2. ngOnInit é o lugar perfeito para configurar "ouvintes"
  ngOnInit(): void {
    this.roleControl.valueChanges.subscribe(role => {
      this.updateValidators(role);
    });
  }

  // 3. Função que adiciona/remove as regras de validação
  updateValidators(role: string): void {
    const firstName = this.registerForm.get('firstName');
    const lastName = this.registerForm.get('lastName');
    const companyName = this.registerForm.get('companyName');

    if (role === 'FREELANCER') {
      firstName?.setValidators([Validators.required]);
      lastName?.setValidators([Validators.required]);
      companyName?.clearValidators(); // Remove a validação do campo de empresa
    } else if (role === 'CLIENT') {
      firstName?.clearValidators(); // Remove a validação dos campos de nome
      lastName?.clearValidators();
      companyName?.setValidators([Validators.required]);
    }

    // Atualiza o estado de validação de todos os campos
    firstName?.updateValueAndValidity();
    lastName?.updateValueAndValidity();
    companyName?.updateValueAndValidity();
  }

 onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          // 5. Mostra a notificação de sucesso
          this.snackBar.open('Conta criada com sucesso! Por favor, faça o login.', 'Fechar', {
            duration: 5000,
          });
          // 6. Redireciona para a página de login
          this.router.navigate(['/login']);
        },
        error: (err) => {
          // 7. Mostra a notificação de erro vinda da API
          this.snackBar.open(err.error.message || 'Ocorreu um erro no registro.', 'Fechar', {
            duration: 5000,
            panelClass: 'error-snackbar' // Classe para deixar vermelho (já configurada em styles.scss)
          });
        }
      });
    }
  }
}
