import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule,
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
            <mat-error *ngIf="staffForm.get('firstName')?.hasError('required')"> First name is required </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" required />
            <mat-error *ngIf="staffForm.get('lastName')?.hasError('required')"> Last name is required </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required />
            <mat-error *ngIf="staffForm.get('email')?.hasError('required')"> Email is required </mat-error>
            <mat-error *ngIf="staffForm.get('email')?.hasError('email')"> Please enter a valid email </mat-error>
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
              <mat-option *ngFor="let role of roles" [value]="role.id">
                {{ role.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="staffForm.get('role')?.hasError('required')"> Role is required </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" required>
              <mat-option *ngFor="let status of statuses" [value]="status.id">
                {{ status.name }}
              </mat-option>
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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StaffFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StaffFormData,
  ) {
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

    if (data.mode === 'edit' && data.staff) {
      this.patchForm(data.staff);
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
