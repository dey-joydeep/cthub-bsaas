import { CommonModule, formatDate } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit,  } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Appointment, AppointmentsFilter, AppointmentsOverview, StatusBadgeConfig } from './models/appointments-overview-widget.model';
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';
import { AppointmentsOverviewWidgetService } from './appointments-overview-widget.service';

@Component({
  selector: 'app-appointments-overview-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule
  ],
  templateUrl: './appointments-overview-widget.component.html',
  styleUrls: ['./appointments-overview-widget.component.css'],
})
export class AppointmentsOverviewWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  sort = viewChild<MatSort>(MatSort);

  // Data
  overview: AppointmentsOverview | null = null;
  dataSource = new MatTableDataSource<Appointment>([]);
  displayedColumns: string[] = ['title', 'customerName', 'staffName', 'serviceName', 'startTime', 'duration', 'status', 'actions'];

  // Loading & error states
  isLoading = true;
  error: string | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  totalItems = 0;

  // Filters
  filters: AppointmentsFilter = {};
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Status filter
  statusFilter = new FormControl<AppointmentStatus | 'ALL'>('ALL');
  statusOptions = [
    { value: 'ALL' as const, label: 'All Statuses' },
    { value: AppointmentStatus.PENDING, label: 'Pending' },
    { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
    { value: AppointmentStatus.NOSHOW, label: 'No Show' },
  ] as const;

  // Tabs
  selectedTabIndex = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private appointmentsOverviewWidgetService: AppointmentsOverviewWidgetService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadData();

    // Subscribe to status filter changes
    this.statusFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.filters.status = status === 'ALL' ? undefined : (status as AppointmentStatus);
      this.loadData();
    });

    // Subscribe to date range changes with debounce
    this.dateRange.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((range) => {
      this.filters = {
        ...this.filters,
        startDate: range.start ? formatDate(range.start, 'yyyy-MM-dd', 'en-US') : undefined,
        endDate: range.end ? formatDate(range.end, 'yyyy-MM-dd', 'en-US') : undefined,
      };
      this.loadData();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load appointments overview and data
   */
  loadData(): void {
    this.isLoading = true;
    this.error = null;

    // Load overview data
    this.appointmentsOverviewWidgetService
      .getAppointmentsOverview(this.filters)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading appointments overview:', error);
          this.error = this.translate.instant('DASHBOARD.APPOINTMENTS.ERROR_LOADING');
          return of(null);
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((overview) => {
        if (overview) {
          this.overview = overview;
          this.dataSource.data = overview.upcomingAppointments;
          this.totalItems = overview.totalAppointments;
        }
      });
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  /**
   * Handle sort change event
   */
  onSortChange(sort: Sort): void {
    this.filters.sortField = sort.active;
    this.filters.sortDirection = sort.direction as 'asc' | 'desc';
    this.loadData();
  }

  /**
   * Refresh the data
   */
  refresh(): void {
    this.loadData();
  }

  /**
   * Get the color associated with a status
   * @param status The appointment status or 'ALL'
   * @returns The color for the status
   */
  getStatusColor(status: AppointmentStatus | 'ALL'): string {
    // If status is 'ALL', return a default color
    if (status === 'ALL') {
      return '#6c757d'; // Gray
    }

    // Handle the enum values
    const colors: Record<AppointmentStatus, string> = {
      PENDING: '#ffc107', // Amber
      CONFIRMED: '#17a2b8', // Teal
      COMPLETED: '#28a745', // Green
      CANCELLED: '#dc3545', // Red
      NOSHOW: '#6c757d', // Gray
      RESCHEDULED: '#6c757d', // Gray
    };

    return colors[status] || '#6c757d'; // Default gray for unknown statuses
  }

  /**
   * Get an array of the last 7 days
   */
  getLast7Days(): { date: Date; label: string }[] {
    const days: { date: Date; label: string }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      days.push({
        date,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      });
    }

    return days;
  }

  /**
   * Get the icon for a status
   * @param status The appointment status or 'ALL' string
   * @returns The icon name
   */
  getStatusIcon(status: AppointmentStatus | 'ALL'): string {
    const icons: Record<AppointmentStatus | 'ALL', string> = {
      ALL: 'schedule',
      [AppointmentStatus.PENDING]: 'schedule',
      [AppointmentStatus.CONFIRMED]: 'check_circle',
      [AppointmentStatus.COMPLETED]: 'done_all',
      [AppointmentStatus.CANCELLED]: 'cancel',
      [AppointmentStatus.NOSHOW]: 'no_accounts',
      [AppointmentStatus.RESCHEDULED]: 'reschedule',
    };
    return icons[status as AppointmentStatus] || 'help';
  }

  /**
   * Get the status badge configuration
   */
  getStatusBadge(status: AppointmentStatus): StatusBadgeConfig {
    // Convert string 'PENDING' to AppointmentStatus.PENDING if needed
    const statusValue = status === 'PENDING' ? AppointmentStatus.PENDING : status;

    const badges: Record<AppointmentStatus, StatusBadgeConfig> = {
      [AppointmentStatus.PENDING]: {
        text: this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS.PENDING'),
        class: 'status-pending',
        icon: 'schedule',
      },
      [AppointmentStatus.CONFIRMED]: {
        text: this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS.CONFIRMED'),
        class: 'status-confirmed',
        icon: 'check_circle',
      },
      [AppointmentStatus.COMPLETED]: {
        text: this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS.COMPLETED'),
        class: 'status-completed',
        icon: 'done_all',
      },
      [AppointmentStatus.CANCELLED]: {
        text: this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS.CANCELLED'),
        class: 'status-cancelled',
        icon: 'cancel',
      },
      [AppointmentStatus.NOSHOW]: {
        text: this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS.NOSHOW'),
        class: 'status-noshow',
        icon: 'no_accounts',
      },
      [AppointmentStatus.RESCHEDULED]: {
        text: this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS.RESCHEDULED'),
        class: 'status-rescheduled',
        icon: 'reschedule',
      },
    };

    return (
      badges[statusValue as AppointmentStatus] || {
        text: statusValue,
        class: 'status-unknown',
        icon: 'help',
      }
    );
  }

  /**
   * Format a date string to a readable format
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Format duration in minutes to hours and minutes
   */
  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  /**
   * Change the status of an appointment
   */
  changeStatus(appointment: Appointment, status: AppointmentStatus): void {
    if (appointment.status === status) return;

    this.appointmentsOverviewWidgetService
      .updateAppointmentStatus(appointment.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS_UPDATED'), this.translate.instant('COMMON.CLOSE'), {
            duration: 3000,
          });
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating appointment status:', error);
          this.snackBar.open(this.translate.instant('DASHBOARD.APPOINTMENTS.STATUS_UPDATE_ERROR'), this.translate.instant('COMMON.CLOSE'), {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  /**
   * Handle status change from the template
   * This is a wrapper around changeStatus that safely handles the status type
   */
  onStatusChange(appointment: Appointment, status: string): void {
    // Only proceed if the status is a valid AppointmentStatus (not 'ALL')
    if (status !== 'ALL' && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      this.changeStatus(appointment, status as AppointmentStatus);
    }
  }

  /**
   * Check if a date is today
   * @param dateInput - Date string or Date object
   */
  isToday(dateInput: string | Date): boolean {
    if (!dateInput) return false;

    const date = new Date(dateInput);
    const today = new Date();

    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  /**
   * Check if a date is in the past
   * @param dateInput - Date string or Date object
   */
  isPast(dateInput: string | Date): boolean {
    if (!dateInput) return false;

    const date = new Date(dateInput);
    const now = new Date();

    // Set both dates to midnight for accurate day comparison
    const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return dateAtMidnight < nowAtMidnight && !this.isToday(dateInput);
  }

  /**
   * Get the appropriate icon for an appointment based on its status and date
   */
  getAppointmentIcon(appointment: Appointment): string {
    if (this.isPast(appointment.endTime) && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED') {
      return 'warning'; // Missed appointment
    }

    if (this.isToday(appointment.startTime)) {
      return 'today'; // Today's appointment
    }

    // Default icon based on status
    const statusIcons: Record<AppointmentStatus, string> = {
      PENDING: 'schedule',
      CONFIRMED: 'event_available',
      COMPLETED: 'done_all',
      CANCELLED: 'cancel',
      NOSHOW: 'no_accounts',
      RESCHEDULED: 'reschedule',
    };

    return statusIcons[appointment.status] || 'event';
  }
}
