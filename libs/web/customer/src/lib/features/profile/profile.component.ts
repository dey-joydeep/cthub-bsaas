import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { ProfileService } from './profile.service';
import { User } from './model/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    TranslatePipe, TranslateDirective,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  currentUser: User | null = null;
  error: string | null = null;
  success: string | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      contact: [''],
      password: [''],
      profilePicture: [null as File | null],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileForm.patchValue({
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          contact: user.phone || '',
        });
      }
    });
  }

  onImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.profileForm.patchValue({ profilePicture: file });
      this.profileForm.get('profilePicture')?.updateValueAndValidity();
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    const { name, email, contact, password, profilePicture } = this.profileForm.value;
    if (!name || !email || !contact) {
      this.isSubmitting = false;
      this.error = 'Name, email, and contact are required.';
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('contact', contact);
    if (password) formData.append('password', password);
    if (profilePicture) formData.append('profilePicture', profilePicture);

    this.profileService.updateProfile(formData).subscribe({
      next: (res: { success: boolean }) => {
        this.isSubmitting = false;
        if (res.success) {
          this.success = 'Profile updated!';
          this.snackBar.open(this.translate.instant('PROFILE.UPDATE_SUCCESS'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 });
        } else {
          this.error = 'Failed to update profile.';
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.error = err.userMessage || 'Error updating profile.';
      },
    });
  }
}
