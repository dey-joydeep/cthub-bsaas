import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

export interface StaffFormData {
  mode: 'add' | 'edit';
  staff?: any;
}

@Component({
  selector: 'app-staff-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'add' ? 'Add New Staff Member' : 'Edit Staff Member' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="staffForm" (ngSubmit)="onSubmit()">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" required />
            @if (staffForm.get('firstName')?.hasError('required')) {
              <mat-error> First name is required </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" required />
            @if (staffForm.get('lastName')?.hasError('required')) {
              <mat-error> Last name is required </mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required />
            @if (staffForm.get('email')?.hasError('required')) {
              <mat-error> Email is required </mat-error>
            }
            @if (staffForm.get('email')?.hasError('email')) {
              <mat-error> Please enter a valid email </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role" required>
              @for (role of roles; track role) {
                <mat-option [value]="role.id">
                  {{ role.name }}
                </mat-option>
              }
            </mat-select>
            @if (staffForm.get('role')?.hasError('required')) {
              <mat-error> Role is required </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" required>
              @for (status of statuses; track status) {
                <mat-option [value]="status.id">
                  {{ status.name }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Hire Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="hireDate" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Hourly Rate</mat-label>
            <input matInput type="number" formControlName="hourlyRate" min="0" step="0.01" />
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="form-field full-width">
          <mat-label>Bio</mat-label>
          <textarea matInput formControlName="bio" rows="3"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <button type="button" mat-button (click)="onCancel()">Cancel</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="!staffForm.valid">
            {{ data.mode === 'add' ? 'Add Staff' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </mat-dialog-content>
  `,
  styles: [
    `
      .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .form-field {
        flex: 1;
      }

      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
      }

      mat-dialog-content {
        padding: 0 24px 24px;
      }

      h2 {
        margin: 0;
        padding: 24px 24px 16px;
        font-size: 20px;
        font-weight: 500;
      }
    `,
  ],
})
export class StaffFormDialogComponent {
  staffForm: FormGroup;

  roles = [
    { id: 'stylist', name: 'Stylist' },
    { id: 'colorist', name: 'Colorist' },
    { id: 'manicurist', name: 'Manicurist' },
    { id: 'therapist', name: 'Therapist' },
    { id: 'receptionist', name: 'Receptionist' },
    { id: 'manager', name: 'Manager' },
  ];

  statuses = [
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' },
    { id: 'on_leave', name: 'On Leave' },
    { id: 'pending', name: 'Pending' },
  ];
  private readonly fb = inject(FormBuilder);
  public readonly dialogRef = inject(MatDialogRef<StaffFormDialogComponent>);
  public readonly data = inject<StaffFormData>(MAT_DIALOG_DATA);

  constructor() {
    this.staffForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['', Validators.required],
      status: ['active', Validators.required],
      hireDate: [new Date()],
      hourlyRate: [''],
      bio: [''],
    });

    if (this.data?.mode === 'edit' && this.data.staff) {
      this.patchForm(this.data.staff);
    }
  }

  private patchForm(staff: any): void {
    // Map the staff data to the form controls
    this.staffForm.patchValue({
      firstName: staff.name?.split(' ')[0] || '',
      lastName: staff.name?.split(' ').slice(1).join(' ') || '',
      email: staff.email || '',
      role: staff.role || '',
      status: staff.status || 'active',
      hireDate: staff.hireDate || new Date(),
      // Add other fields as needed
    });
  }

  onSubmit(): void {
    if (this.staffForm.valid) {
      const formValue = this.staffForm.value;
      const staffData = {
        name: `${formValue.firstName} ${formValue.lastName}`.trim(),
        email: formValue.email,
        phone: formValue.phone,
        role: formValue.role,
        status: formValue.status,
        hireDate: formValue.hireDate,
        hourlyRate: formValue.hourlyRate,
        bio: formValue.bio,
      };

      this.dialogRef.close(staffData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
