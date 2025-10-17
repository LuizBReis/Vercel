import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user';

// Imports do Material
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

// Validador customizado
export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword && confirmPassword && newPassword.value !== confirmPassword.value ? { passwordsDoNotMatch: true } : null;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class Settings {
  changePasswordForm: FormGroup;
  changeEmailForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router, // Injete o serviço de notificação
    private userService: UserService
  ) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordsMatchValidator });
    // 4. Crie o novo formulário de e-mail
    this.changeEmailForm = this.fb.group({
      password: ['', [Validators.required]],
      newEmail: ['', [Validators.required, Validators.email]],
    }); // Aplica o validador ao formulário inteiro
  }

  onSubmitPassWord(): void {
    if (this.changePasswordForm.invalid) {
      return;
    }

    const { oldPassword, newPassword } = this.changePasswordForm.value;
    this.authService.changePassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.snackBar.open('Senha alterada com sucesso!', 'Fechar', { duration: 3000 });
        this.changePasswordForm.reset();
      },
      error: (err) => {
        // Mostra o erro da API na notificação
        this.snackBar.open(err.error.message || 'Erro ao alterar senha', 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }

   // 5. Crie o novo método para salvar o e-mail
  onSubmitEmail(): void {
    if (this.changeEmailForm.invalid) {
      return;
    }

    this.authService.changeEmail(this.changeEmailForm.value).subscribe({
      next: () => {
        this.snackBar.open('E-mail alterado com sucesso! Por favor, faça login novamente.', 'Fechar', { duration: 5000 });
        // Força o logout por segurança, já que a credencial principal mudou
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Erro ao alterar e-mail', 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }

  onDeleteAccount(): void {
    // Usamos duas confirmações para uma ação tão destrutiva
    if (confirm('Tem certeza de que deseja excluir sua conta?')) {
      if (confirm('ESTA AÇÃO É IRREVERSÍVEL. Todos os seus dados, vagas e candidaturas serão perdidos para sempre. Continuar?')) {
        this.userService.deleteMyAccount().subscribe({
          next: () => {
            alert('Sua conta foi excluída com sucesso.');
            this.authService.logout(); // Limpa o token do localStorage
            this.router.navigate(['/register']); // Redireciona para uma página pública
          },
          error: (err: any) => {
            console.error('Erro ao excluir conta:', err);
            alert('Ocorreu um erro ao tentar excluir sua conta.');
          }
        });
      }
    }
  }
}
