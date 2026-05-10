import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CURRENT_USER } from '@cthub-bsaas/web-core/auth';
import type { CurrentUserPort } from '@cthub-bsaas/web-core/auth';
import { Subscription } from 'rxjs';

type MaybeUser = {
  id?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

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
    TranslateModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  isLoading = false;
  currentUser: Partial<MaybeUser> | null = null;
  isEditing = false;
  private sub?: Subscription;

  constructor(
    private fb: FormBuilder,
    @Inject(CURRENT_USER) private currentUserPort: CurrentUserPort,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ngOnInit(): void {
    this.sub = this.currentUserPort.currentUser$.subscribe((user) => {
      const u = (user || null) as Partial<MaybeUser> | null;
      this.currentUser = u;
      if (u) {
        this.profileForm.patchValue({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          phone: u.phone || '',
        });
        this.profileForm.disable();
      }
    });
  }

  onEdit(): void {
    this.isEditing = true;
    this.profileForm.enable();
    // Keep email disabled as it shouldn't be changed
    this.profileForm.get('email')?.disable();
  }

  onCancel(): void {
    this.isEditing = false;
    // Reset to current user values
    const u = this.currentUser;
    if (u) {
      this.profileForm.patchValue({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        phone: u.phone || '',
      });
      this.profileForm.disable();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.currentUser) {
      return;
    }

    this.isLoading = true;
    const updatedUser = {
      ...this.currentUser,
      ...this.profileForm.value,
    };

    // Simulate API call
    setTimeout(() => {
      // TODO: integrate with actual user update port/service
      this.isLoading = false;
      this.isEditing = false;
      this.profileForm.disable();

      this.snackBar.open(this.translate.instant('PROFILE.UPDATE_SUCCESS'), this.translate.instant('COMMON.CLOSE'), { duration: 3000 });
    }, 1000);
  }

  get firstName() {
    return this.profileForm.get('firstName');
  }

  get lastName() {
    return this.profileForm.get('lastName');
  }

  get email() {
    return this.profileForm.get('email');
  }
}
