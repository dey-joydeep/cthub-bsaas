import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { Appointment } from '../appointment-list/model/appointment-list.model';
import { LoadingService } from '@cthub-bsaas/web-core-common';
import { AppointmentRescheduleService } from './appointment-reschedule.service';
import { AppointmentStatus } from '@cthub-bsaas/shared';

@Component({
  selector: 'app-appointment-reschedule',
  standalone: true,
  imports: [
    DatePipe,
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
  ],
  templateUrl: './appointment-reschedule.component.html',
  styleUrls: ['./appointment-reschedule.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  dateTimeFormGroup: FormGroup;
  reviewFormGroup: FormGroup;

  availableTimeSlots: string[] = [];

  get minDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  get maxDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  }

  get dateControl(): FormControl {
    return this.dateTimeFormGroup.get('date') as FormControl;
  }

  private readonly appointmentRescheduleService = inject(AppointmentRescheduleService);
  private readonly loadingService = inject(LoadingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  get minDateString(): string {
    return this.minDate.toISOString();
  }

  constructor() {
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

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today ? null : { pastDate: true };
  }

  formatDate(date: Date | string): string {
    return this.datePipe.transform(date, 'mediumDate') || '';
  }

  formatTime(date: Date | string): string {
    return this.datePipe.transform(date, 'shortTime') || '';
  }

  getServiceName(_serviceId: string): string {
    // TODO: Implement service lookup from service
    return 'Service';
  }

  getStaffName(_staffId: string): string {
    // TODO: Implement staff lookup from service
    return 'Staff Member';
  }

  private handleError(error: Error): void {
    console.error('Appointment error:', error);
    this.snackBar.open($localize`:@@ERRORS.GENERAL:An error occurred. Please try again.`, $localize`:@@COMMON.CLOSE:Close`, {
      duration: 5000,
    });
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.appointment) {
      return;
    }

    this.isSubmitting = true;
    this.loadingService.show();

    const { date, time: _time } = this.dateTimeFormGroup.value;
    const notes = this.reviewFormGroup.get('notes')?.value || '';

    const dateValue = this.dateControl.value;
    const timeValue = this.dateTimeFormGroup.get('time')?.value;
    const [hours, minutes] = timeValue.split(':').map(Number);
    const startTime = new Date(dateValue);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    const durationMinutes = this.calculateDurationInMinutes(this.appointment);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    this.appointmentRescheduleService
      .getAvailableTimeSlots({
        serviceId: this.appointment.serviceId,
        staffId: this.appointment.staffId,
        date: date.toISOString().split('T')[0],
        duration: durationMinutes,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (timeSlots) => {
          this.availableTimeSlots = timeSlots.map((slot) => slot.time);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading time slots:', error);
          this.snackBar.open(
            $localize`:@@APPOINTMENT.RESCHEDULE.TIME_SLOTS_ERROR:Failed to load available time slots.`,
            $localize`:@@COMMON.CLOSE:Close`,
            {
              duration: 3000,
            },
          );
          this.isLoading = false;
        },
      });

    this.appointmentRescheduleService
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
          this.snackBar.open(
            $localize`:@@APPOINTMENT.RESCHEDULE_SUCCESS:Appointment rescheduled successfully.`,
            $localize`:@@COMMON.CLOSE:Close`,
            {
              duration: 5000,
            },
          );
          this.router.navigate(['/appointments']);
        },
        error: (error: Error) => this.handleError(error),
      });
  }

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

    const durationMinutes = this.calculateDurationInMinutes(this.appointment);

    this.appointmentRescheduleService
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
          this.availableTimeSlots = timeSlots.map((slot) => slot.time);

          if (!this.dateTimeFormGroup.get('time')?.value && this.availableTimeSlots.length > 0) {
            this.dateTimeFormGroup.get('time')?.setValue(this.availableTimeSlots[0]);
          }
        },
        error: (error: Error) => this.handleError(error),
      });
  }

  private loadAppointmentDetails(): void {
    const appointmentId = this.route.snapshot.paramMap.get('id');
    if (!appointmentId) {
      this.handleError(new Error('No appointment ID provided'));
      this.router.navigate(['/appointments']);
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    this.appointmentRescheduleService
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
