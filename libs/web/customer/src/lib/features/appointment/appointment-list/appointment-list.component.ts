import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '@cthub-bsaas/web-ui';
import { Appointment, DialogResult } from './model/appointment-list.model';
import { AppointmentListService } from './appointment-list.service';
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './appointment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./appointment-list.component.css'],
})
export class AppointmentListComponent implements OnInit {
  displayedColumns: string[] = ['service', 'date', 'status', 'price', 'actions'];
  dataSource: Appointment[] = [];
  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  private readonly appointmentListService = inject(AppointmentListService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;

    const params = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
    };

    this.appointmentListService.getAppointments(params).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalItems = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open($localize`:@@APPOINTMENT.LIST.LOAD_ERROR:Failed to load appointments.`, $localize`:@@COMMON.CLOSE:Close`, {
          duration: 5000,
        });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAppointments();
  }

  onCancelAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: $localize`:@@APPOINTMENT.CANCEL_CONFIRM_TITLE:Confirm Cancellation`,
        message: $localize`:@@APPOINTMENT.CANCEL_CONFIRM_MESSAGE:Are you sure you want to cancel this appointment?`,
        confirmText: $localize`:@@APPOINTMENT.CANCEL:Cancel Appointment`,
        cancelText: $localize`:@@COMMON.CANCEL:Cancel`,
        showReason: true,
      },
    });

    dialogRef.afterClosed().subscribe((result: DialogResult) => {
      if (result?.action === 'confirm') {
        this.isLoading = true;
        const reason = result.reason || '';
        this.appointmentListService.cancelAppointment(appointment.id, reason).subscribe({
          next: () => {
            this.snackBar.open(
              $localize`:@@APPOINTMENT.CANCEL_SUCCESS:Appointment cancelled successfully.`,
              $localize`:@@COMMON.CLOSE:Close`,
              {
                duration: 5000,
              },
            );
            this.loadAppointments();
          },
          error: (error) => {
            console.error('Error cancelling appointment:', error);
            this.snackBar.open($localize`:@@APPOINTMENT.CANCEL_ERROR:Failed to cancel appointment.`, $localize`:@@COMMON.CLOSE:Close`, {
              duration: 5000,
            });
            this.isLoading = false;
          },
        });
      }
    });
  }

  onReschedule(appointment: Appointment): void {
    void appointment;
    // Implementation for reschedule
    this.snackBar.open($localize`:@@APPOINTMENT.RESCHEDULE_MESSAGE:Please select a new time slot.`, $localize`:@@COMMON.CLOSE:Close`, {
      duration: 3000,
    });
  }

  getStatusChipClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'status-confirmed';
      case AppointmentStatus.CONFIRMED:
        return 'status-completed';
      case AppointmentStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }
}
