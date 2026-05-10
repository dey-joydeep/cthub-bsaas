import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from './user.service';
import { CurrentUserService } from '../../core/auth/services/current-user.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent implements OnInit {
  profileForm;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public currentUserService: CurrentUserService,
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', Validators.required],
      password: [''],
      profilePicture: [null as File | null],
    });
  }

  ngOnInit() {
    // Populate form with current user info
    const user = this.currentUserService.currentUser;
    if (user) {
      this.profileForm.patchValue({
        name: `${user.firstName} ${user.lastName}`.trim(), // Combine firstName and lastName
        email: user.email,
        contact: user.phone || '',
      });
    }
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

  onSubmit() {
    if (this.profileForm.invalid) return;
    this.loading = true;
    this.error = null;
    // Ensure all required fields are present and not null
    const { name, email, contact, password, profilePicture } = this.profileForm.value;
    if (!name || !email || !contact) {
      this.loading = false;
      this.error = 'Name, email, and contact are required.';
      return;
    }
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('contact', contact);
    if (password) formData.append('password', password);
    if (profilePicture) formData.append('profilePicture', profilePicture);
    this.userService.updateProfile(formData).subscribe({
      next: (res: { success: boolean }) => {
        this.loading = false;
        if (res.success) {
          this.success = 'Profile updated!';
        } else {
          this.error = 'Failed to update profile.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.userMessage || 'Error updating profile.';
      },
    });
  }
}
