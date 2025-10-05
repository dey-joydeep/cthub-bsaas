import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Appointment } from '../../../models/appointment.model';

export interface DialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-appointment-cancel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './appointment-cancel-dialog.component.html',
  styleUrls: ['./appointment-cancel-dialog.component.scss'],
})
export class AppointmentCancelDialogComponent {
  cancelForm: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<AppointmentCancelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.cancelForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  onNoClick(): void {
    this.dialogRef.close({ action: 'cancelled' });
  }

  onSubmit(): void {
    if (this.cancelForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const reason = this.cancelForm.get('reason')?.value;

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.snackBar.open(this.translate.instant('APPOINTMENT.CANCELLATION_SUCCESS'), this.translate.instant('COMMON.CLOSE'), {
        duration: 3000,
      });
      this.dialogRef.close({
        action: 'confirmed',
        reason: reason,
      });
    }, 1500);
  }

  get reason() {
    return this.cancelForm.get('reason');
  }

  get appointmentDate(): string {
    return this.data.appointment.startTime ? new Date(this.data.appointment.startTime).toLocaleDateString() : '';
  }

  get appointmentTime(): string {
    return this.data.appointment.startTime && this.data.appointment.endTime
      ? `${this.data.appointment.startTime} - ${this.data.appointment.endTime}`
      : '';
  }
}
