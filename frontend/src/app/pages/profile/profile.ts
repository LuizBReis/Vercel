import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

import { UserService, UserProfile, WorkExperience } from '../../services/user';
import { AuthService } from '../../auth/auth.service';
import { SkillService, Skill } from '../../services/skill';
import { ExperienceForm } from '../../components/experience-form/experience-form';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importe o MatSnackBar

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe, TitleCasePipe,
    MatAutocompleteModule, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading = true;
  isOwnProfile = false;
  isEditing = false;
  profileForm: FormGroup;
  skillControl = new FormControl('', { nonNullable: true });

  allSuggestedSkills: Skill[] = [];
  filteredSkills$: Observable<Skill[]>;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private skillService: SkillService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar // Injete o MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      description: [''],
      companyName: [''],  // Específico do Cliente
      location: [''],     // Específico do Cliente
    });
    this.filteredSkills$ = new Observable<Skill[]>();
  }

  ngOnInit(): void {
    this.skillService.getSuggestedSkills().subscribe(skills => {
      this.allSuggestedSkills = skills;
    });

    this.filteredSkills$ = this.skillControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSkills(value || ''))
    );

        const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.isOwnProfile = this.authService.getUserId() === userId;
      this.userService.getUserProfile(userId).subscribe({
        next: (data) => {
          this.userProfile = data;
          // Preenche o formulário com a estrutura correta
          this.profileForm.patchValue({
            firstName: data.firstName,
            lastName: data.lastName,
            description: data.role === 'FREELANCER' ? data.freelancerProfile?.description : data.clientProfile?.description,
            companyName: data.clientProfile?.companyName,
            location: data.clientProfile?.location
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar perfil:', err);
          this.isLoading = false;
        }
      });
    }
  }

  private _filterSkills(value: string): Skill[] {
    const filterValue = value.toLowerCase();
    return this.allSuggestedSkills.filter(skill =>
      skill.name.toLowerCase().includes(filterValue)
    );
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  onSave(): void {
    if (this.profileForm.valid && this.userProfile) {
      this.userService.updateMyProfile(this.profileForm.value).subscribe({
        next: (updatedProfile) => {
          this.userProfile = updatedProfile;
          this.isEditing = false;
          this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', { duration: 3000 });
        },
        error: (err: any) => console.error('Erro ao salvar perfil:', err)
      });
    }
  }

  onAddSkill(): void {
    if (this.skillControl.valid && this.skillControl.value) {
      const skillName = this.skillControl.value;
      this.userService.addSkill(skillName).subscribe({
        next: (updatedProfile) => {
          // Atualiza apenas a parte do freelancerProfile para não perder outros dados
          if(this.userProfile) this.userProfile.freelancerProfile = updatedProfile.freelancerProfile;
          this.skillControl.reset();
        },
        error: (err: any) => console.error('Erro ao adicionar skill:', err)
      });
    }
  }

  onRemoveSkill(skillName: string): void {
    this.userService.removeSkill(skillName).subscribe({
      next: (updatedProfile) => {
        if(this.userProfile) this.userProfile.freelancerProfile = updatedProfile.freelancerProfile;
      },
      error: (err: any) => console.error('Erro ao remover skill:', err)
    });
  }

  openExperienceDialog(experience?: WorkExperience): void {
    const dialogRef = this.dialog.open(ExperienceForm, {
      width: '600px',
      data: experience,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.userProfile?.freelancerProfile) {
        if (experience) {
          this.userService.updateWorkExperience(experience.id, result).subscribe({
            next: () => {
              const index = this.userProfile!.freelancerProfile!.workExperiences.findIndex(exp => exp.id === experience.id);
              if (index > -1) {
                this.userProfile!.freelancerProfile!.workExperiences[index] = { ...this.userProfile!.freelancerProfile!.workExperiences[index], ...result };
              }
            },
            error: (err: any) => console.error('Erro ao atualizar experiência:', err),
          });
        } else {
          this.userService.addWorkExperience(result).subscribe({
            next: (newExperience: WorkExperience) => {
              if (!this.userProfile!.freelancerProfile!.workExperiences) {
                this.userProfile!.freelancerProfile!.workExperiences = [];
              }
              this.userProfile!.freelancerProfile!.workExperiences.unshift(newExperience);
            },
            error: (err: any) => console.error('Erro ao adicionar experiência:', err),
          });
        }
      }
    });
  }

  onDeleteExperience(experienceId: string): void {
    if (confirm('Tem certeza de que deseja remover esta experiência?')) {
      this.userService.deleteWorkExperience(experienceId).subscribe({
        next: () => {
          if (this.userProfile?.freelancerProfile?.workExperiences) {
            this.userProfile.freelancerProfile.workExperiences = this.userProfile.freelancerProfile.workExperiences.filter(
              exp => exp.id !== experienceId
            );
          }
        },
        error: (err: any) => console.error('Erro ao remover experiência:', err),
      });
    }
  }
}