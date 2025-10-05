import { Component, OnDestroy, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { Appointment, TimeSlot } from '../models/appointment.model';
import { LoadingService } from '@cthub-bsaas/web-core/http';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentStatus } from '@cthub-bsaas/shared';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Using the base Appointment model which already has startTime and endTime

@Component({
  selector: 'app-appointment-reschedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './appointment-reschedule.component.html',
  styleUrls: ['./appointment-reschedule.component.scss'],
  providers: [{ provide: DatePipe, useClass: DatePipe }],
})
@Component({
  selector: 'app-appointment-reschedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './appointment-reschedule.component.html',
  styleUrls: ['./appointment-reschedule.component.scss'],
  providers: [{ provide: DatePipe, useClass: DatePipe }],
})
export class AppointmentRescheduleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLinear = true;
  isLoading = true;
  isSubmitting = false;
  appointment: Appointment | null = null;
  selectedDate: Date | null = null;
  selectedTime: string | null = null;

  // Form groups for the stepper
  dateTimeFormGroup: FormGroup;
  reviewFormGroup: FormGroup;

  // Available time slots
  availableTimeSlots: TimeSlot[] = [];

  // Get minimum date for date picker (today)
  get minDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  // Get maximum date for date picker (3 months from now)
  get maxDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  }

  // Getter for date form control
  get dateControl(): FormControl {
    return this.dateTimeFormGroup.get('date') as FormControl;
  }

  // Convert minDate to string for template binding
  get minDateString(): string {
    return this.minDate.toISOString();
  }

  // Translation keys
  private services: { [key: string]: string } = {
    '1': 'SERVICE.HAIR_CUT',
    '2': 'SERVICE.COLORING',
    '3': 'SERVICE.STYLING',
  };

  private staffMembers: { [key: string]: string } = {
    '1': 'STAFF.JOHN_DOE',
    '2': 'STAFF.JANE_SMITH',
    '3': 'STAFF.BOB_JOHNSON',
  };

  private salons: { [key: string]: string } = {
    '1': 'SALON.MAIN',
    '2': 'SALON.DOWNTOWN',
    '3': 'SALON.UPTON',
  };

  constructor(
    private appointmentService: AppointmentService,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: Appointment },
    private dialogRef: MatDialogRef<AppointmentRescheduleComponent>,
    @Inject(LoadingService) private loadingService: LoadingService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    @Inject(MAT_SNACK_BAR_DEFAULT_OPTIONS) private snackBarConfig: any,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    // Initialize form groups
    this.dateTimeFormGroup = this.fb.group({
      date: ['', [Validators.required, this.futureDateValidator.bind(this)]],
      time: ['', Validators.required],
    });

    this.reviewFormGroup = this.fb.group({
      notes: [''],
      confirm: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    this.loadAppointmentDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Date validator function
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today ? null : { pastDate: true };
  }

  // Format date for display
  formatDate(date: Date | string): string {
    return this.datePipe.transform(date, 'mediumDate') || '';
  }

  // Format time for display
  formatTime(date: Date | string): string {
    return this.datePipe.transform(date, 'shortTime') || '';
  }

  getServiceName(serviceId: string): string {
    // TODO: Implement service lookup from service
    return 'Service';
  }

  getStaffName(staffId: string): string {
    // TODO: Implement staff lookup from service
    return 'Staff Member';
  }

  private handleError(error: Error): void {
    console.error('Appointment error:', error);
    this.snackBar.open(this.translate.instant('ERRORS.GENERAL'), this.translate.instant('COMMON.CLOSE'), { duration: 5000 });
  }

  // Handle form submission
  onSubmit(): void {
    if (this.isSubmitting || !this.appointment) {
      return;
    }

    this.isSubmitting = true;
    this.loadingService.show();

    const { date, time } = this.dateTimeFormGroup.value;
    const notes = this.reviewFormGroup.get('notes')?.value || '';

    const dateValue = this.dateControl.value;
    const timeValue = this.dateTimeFormGroup.get('time')?.value;
    const [hours, minutes] = timeValue.split(':').map(Number);
    const startTime = new Date(dateValue);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    const durationMinutes = this.calculateDurationInMinutes(this.appointment);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    this.appointmentService
      .getAvailableTimeSlots({
        serviceId: this.appointment.serviceId,
        staffId: this.appointment.staffId,
        date: date.toISOString().split('T')[0],
        duration: durationMinutes,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (timeSlots) => {
          this.availableTimeSlots = timeSlots;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading time slots:', error);
          this.snackBar.open(this.translate.instant('APPOINTMENT.RESCHEDULE.TIME_SLOTS_ERROR'), this.translate.instant('COMMON.CLOSE'), {
            duration: 3000,
          });
          this.isLoading = false;
        },
      });

    this.appointmentService
      .rescheduleAppointment(this.appointment.id, startTime, endTime, notes)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSubmitting = false;
          this.loadingService.hide();
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('APPOINTMENT.RESCHEDULE_SUCCESS'), this.translate.instant('COMMON.CLOSE'), {
            duration: 5000,
          });
          this.router.navigate(['/appointments']);
        },
        error: (error: Error) => this.handleError(error),
      });
  }

  // Load available time slots for selected date and staff
  private calculateDurationInMinutes(appointment: Appointment): number {
    if (!appointment.startTime || !appointment.endTime) {
      return 60; // Default to 1 hour if times are not available
    }
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }

  private loadAvailableTimeSlots(): void {
    if (!this.appointment || !this.selectedDate) return;

    this.isLoading = true;
    this.loadingService.show();

    const selectedDate = this.selectedDate;

    // Calculate duration in minutes
    const durationMinutes = this.calculateDurationInMinutes(this.appointment);

    this.appointmentService
      .getAvailableTimeSlots({
        serviceId: this.appointment.serviceId,
        staffId: this.appointment.staffId,
        date: selectedDate.toISOString().split('T')[0],
        duration: durationMinutes,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.hide()),
      )
      .subscribe({
        next: (timeSlots) => {
          // Map the time slots to the expected format
          this.availableTimeSlots = timeSlots.map((slot) => {
            const slotStart = typeof slot.slotStart === 'string' ? new Date(slot.slotStart) : slot.slotStart;
            const slotEnd = typeof slot.slotEnd === 'string' ? new Date(slot.slotEnd) : slot.slotEnd;

            return {
              ...slot,
              time: slotStart.toISOString(),
              display: this.formatTime(slotStart),
              available: slot.available !== false,
              slotStart,
              slotEnd,
            };
          });

          // Auto-select first available time slot if none selected
          if (!this.dateTimeFormGroup.get('time')?.value && this.availableTimeSlots.length > 0) {
            this.dateTimeFormGroup.get('time')?.setValue(this.availableTimeSlots[0].time);
          }
        },
        error: (error: Error) => this.handleError(error),
      });
  }

  // Load appointment details
  private loadAppointmentDetails(): void {
    const appointmentId = this.route.snapshot.paramMap.get('id');
    if (!appointmentId) {
      this.handleError(new Error('No appointment ID provided'));
      this.router.navigate(['/appointments']);
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    this.appointmentService
      .getAppointment(appointmentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.hide();
        }),
      )
      .subscribe({
        next: (appointment: Appointment) => {
          this.appointment = appointment;
          this.initializeForm(appointment);
          this.loadAvailableTimeSlots();
        },
        error: (error: Error) => {
          this.handleError(error);
        },
      });
  }

  // Initialize form with appointment data
  private initializeForm(appointment: Appointment): void {
    const appointmentDate = new Date(appointment.startTime);
    const appointmentTime = this.formatTime(appointment.startTime);

    this.dateTimeFormGroup = this.fb.group({
      date: [appointmentDate, [Validators.required]],
      time: [appointmentTime, [Validators.required]],
    });

    this.reviewFormGroup = this.fb.group({
      notes: [appointment.notes || ''],
    });
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'badge-pending';
      case AppointmentStatus.CONFIRMED:
        return 'badge-confirmed';
      case AppointmentStatus.COMPLETED:
        return 'badge-completed';
      case AppointmentStatus.CANCELLED:
        return 'badge-cancelled';
      case AppointmentStatus.NOSHOW:
        return 'badge-noshow';
      default:
        return 'badge-pending';
    }
  }

  translateStatus(status: AppointmentStatus): string {
    return `APPOINTMENT.STATUS.${status.toUpperCase()}`;
  }
}
