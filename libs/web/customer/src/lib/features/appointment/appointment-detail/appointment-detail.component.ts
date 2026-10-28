import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { AppointmentCancelDialogComponent } from '../appointment-cancel-dialog/appointment-cancel-dialog.component';
import { AppointmentWithDetails } from './model/appointment-detail.model';
import { AppointmentDetailService } from './appointment-detail.service';
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointment-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./appointment-detail.component.css'],
})
export class AppointmentDetailComponent implements OnInit, OnDestroy {
  // The appointment to display with all details
  appointment: AppointmentWithDetails | null = null;
  isLoading = true;
  isUpdating = false;
  // Make enum available in template
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentDetailService = inject(AppointmentDetailService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly AppointmentStatus = AppointmentStatus;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadAppointment();
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions when component is destroyed
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onCancelAppointment(): void {
    if (!this.appointment) return;

    const dialogRef = this.dialog.open(AppointmentCancelDialogComponent, {
      width: '500px',
      data: {
        appointment: this.appointment,
        // Pass any additional data needed by the dialog
      },
    });

    const dialogSubscription = dialogRef.afterClosed().subscribe((result: { action: string; reason?: string }) => {
      if (result?.action === 'cancelled') {
        this.loadAppointment();
      } else if (result?.action === 'confirmed' && this.appointment) {
        this.isUpdating = true;
        const cancelSubscription = this.appointmentDetailService
          .cancelAppointment(this.appointment.id, result.reason || 'No reason provided')
          .pipe(finalize(() => (this.isUpdating = false)))
          .subscribe({
            next: () => {
              this.snackBar.open(
                $localize`:@@APPOINTMENT.CANCELLATION_SUCCESS:Appointment cancelled successfully.`,
                $localize`:@@COMMON.CLOSE:Close`,
                {
                  duration: 5000,
                },
              );
              this.loadAppointment();
            },
            error: (error: any) => {
              console.error('Error cancelling appointment:', error);
              this.snackBar.open(
                $localize`:@@APPOINTMENT.CANCELLATION_ERROR:Failed to cancel appointment.`,
                $localize`:@@COMMON.CLOSE:Close`,
                {
                  duration: 5000,
                },
              );
            },
          });

        // Store subscription for cleanup
        this.subscriptions.push(cancelSubscription);
      }
    });

    // Store dialog subscription for cleanup
    this.subscriptions.push(dialogSubscription);
  }

  onReschedule(): void {
    if (this.appointment) {
      this.router.navigate(['/appointments', this.appointment.id, 'reschedule']);
    }
  }

  private loadAppointment(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isLoading = false;
      this.snackBar.open($localize`:@@APPOINTMENT.INVALID_ID:Invalid appointment ID.`, $localize`:@@COMMON.CLOSE:Close`, {
        duration: 5000,
      });
      this.router.navigate(['/appointments']);
      return;
    }

    this.isLoading = true;
    const subscription = this.appointmentDetailService
      .getAppointment(id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (appointment: AppointmentWithDetails) => {
          // Use the appointment as is since the API should return it in the correct format
          this.appointment = appointment;
        },
        error: (error: any) => {
          console.error('Error loading appointment:', error);
          this.snackBar.open($localize`:@@APPOINTMENT.LOAD_ERROR:Failed to load appointment details.`, $localize`:@@COMMON.CLOSE:Close`, {
            duration: 5000,
          });
          this.router.navigate(['/appointments']);
        },
      });

    // Store subscription for cleanup
    this.subscriptions.push(subscription);
  }

  getServiceName(serviceId: string): string {
    // TODO: Implement service name lookup
    return serviceId;
  }

  getSalonName(salonId: string): string {
    // TODO: Implement salon name lookup
    return salonId;
  }

  getStaffName(staffId: string): string {
    // TODO: Implement staff name lookup
    return staffId || 'Any available';
  }

  formatAppointmentDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  formatAppointmentTime(startTime: string | undefined, endTime: string | undefined): string {
    if (!startTime || !endTime) return '';
    return `${startTime} - ${endTime}`;
  }

  getStatusText(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  }

  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'status-confirmed';
      case AppointmentStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }
}
