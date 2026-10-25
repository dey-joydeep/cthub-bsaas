import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Appointment } from '../appointment-list/model/appointment-list.model';

export interface DialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-appointment-cancel-dialog',
  standalone: true,
  imports: [
    TitleCasePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointment-cancel-dialog.component.html',
  styleUrls: ['./appointment-cancel-dialog.component.css'],
})
export class AppointmentCancelDialogComponent {
  cancelForm: FormGroup;
  isSubmitting = false;
  public readonly dialogRef = inject(MatDialogRef<AppointmentCancelDialogComponent>);
  public readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
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
      this.snackBar.open(
        $localize`:@@APPOINTMENT.CANCELLATION_SUCCESS:Appointment cancelled successfully.`,
        $localize`:@@COMMON.CLOSE:Close`,
        {
          duration: 3000,
        },
      );
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
