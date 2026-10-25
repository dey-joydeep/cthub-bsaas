import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppointmentStatus } from '@cthub-bsaas/shared';
import { Appointment, AppointmentsOverview } from './models/appointments-overview-widget.model';
import { AppointmentsOverviewWidgetService } from './appointments-overview-widget.service';
import { AppointmentsOverviewWidgetComponent } from './appointments-overview-widget.component';

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? vi.Mock<ReturnType<T[K]>, Parameters<T[K]>> : T[K];
};

describe('AppointmentsOverviewWidgetComponent', () => {
  let component: AppointmentsOverviewWidgetComponent;
  let fixture: ComponentFixture<AppointmentsOverviewWidgetComponent>;
  let dashboardService: Mocked<AppointmentsOverviewWidgetService>;
  let snackBar: vi.Mocked<MatSnackBar>;

  const mockAppointment: Appointment = {
    id: '1',
    title: 'Haircut',
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // 1 hour later
    status: AppointmentStatus.CONFIRMED,
    customerId: 'cust1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    staffId: 'staff1',
    staffName: 'Jane Smith',
    serviceId: 'svc1',
    serviceName: 'Haircut',
    duration: 60,
    price: 50,
    salonId: 'salon1',
    salonName: 'Beauty Salon',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOverview: AppointmentsOverview = {
    totalAppointments: 10,
    pendingAppointments: 2,
    confirmedAppointments: 5,
    completedAppointments: 3,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    totalRevenue: 500,
    averageDuration: 45,
    upcomingAppointments: [mockAppointment],
    recentAppointments: [
      {
        ...mockAppointment,
        id: '2',
        status: AppointmentStatus.COMPLETED,
        startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        endTime: new Date(Date.now() - 86400000 + 3600000).toISOString(), // 1 hour later
      },
    ],
    statusDistribution: {
      [AppointmentStatus.PENDING]: 2,
      [AppointmentStatus.CONFIRMED]: 5,
      [AppointmentStatus.COMPLETED]: 3,
    },
    dailyAppointments: {
      [new Date().toISOString().split('T')[0]]: 3,
      [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: 2,
    },
  };

  beforeEach(async () => {
    dashboardService = {
      getAppointmentsOverview: vi.fn().mockReturnValue(of(mockOverview)),
      updateAppointmentStatus: vi.fn().mockReturnValue(of({ ...mockAppointment, status: AppointmentStatus.COMPLETED })),
    } as any;

    snackBar = { open: vi.fn() } as any;

    await TestBed.configureTestingModule({
      imports: [
        AppointmentsOverviewWidgetComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
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
        ReactiveFormsModule,
        MatSnackBarModule,
        MatTabsModule,
        MatChipsModule,
        MatDividerModule,
        MatListModule,
        MatDialogModule,
      ],
      providers: [
        provideRouter([]),
        { provide: AppointmentsOverviewWidgetService, useValue: dashboardService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentsOverviewWidgetComponent);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar) as unknown as vi.Mocked<MatSnackBar>;
    vi.spyOn(snackBar, 'open');
    dashboardService = TestBed.inject(AppointmentsOverviewWidgetService) as unknown as Mocked<AppointmentsOverviewWidgetService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments overview on init', () => {
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledTimes(1);
    expect(component.overview).toEqual(mockOverview);
    expect(component.dataSource.data).toEqual(mockOverview.upcomingAppointments);
    expect(component.isLoading).toBe(false);
  });

  it('should handle error when loading appointments overview', () => {
    const error = new Error('Failed to load');
    dashboardService.getAppointmentsOverview.mockReturnValueOnce(throwError(() => error));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.error).toBe('Failed to load appointments.');
    expect(component.isLoading).toBe(false);

    const errorElement = fixture.nativeElement.querySelector('.error-container');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Failed to load appointments.');
  });

  it('should filter appointments by status', () => {
    const status = AppointmentStatus.CONFIRMED;
    component.statusFilter.setValue(status);

    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalled();
  });

  it('should filter appointments by date range', fakeAsync(() => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 86400000); // 7 days later

    component.dateRange.setValue({ start: startDate, end: endDate });
    tick(300); // Debounce time

    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalled();
  }));

  it('should update appointment status', fakeAsync(() => {
    const appointment = { ...mockAppointment, status: AppointmentStatus.PENDING };
    const newStatus = AppointmentStatus.COMPLETED;
    const snackBarSpy = vi.spyOn(component['snackBar'], 'open');

    component.changeStatus(appointment, newStatus);
    tick(); // Wait for async operations to complete

    expect(dashboardService.updateAppointmentStatus).toHaveBeenCalledWith(appointment.id, newStatus);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalled();
  }));

  it('should handle error when updating appointment status', () => {
    const appointment = { ...mockAppointment, status: AppointmentStatus.PENDING };
    const error = new Error('Failed to update');
    dashboardService.updateAppointmentStatus.mockReturnValueOnce(throwError(() => error));
    const snackBarSpy = vi.spyOn(component['snackBar'], 'open');

    component.changeStatus(appointment, AppointmentStatus.COMPLETED);

    expect(snackBarSpy).toHaveBeenCalled();
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(30)).toBe('30m');
    expect(component.formatDuration(90)).toBe('1h 30m');
    expect(component.formatDuration(120)).toBe('2h 0m');
  });

  it('should check if date is today', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    expect(component.isToday(today)).toBe(true);
    expect(component.isToday(yesterday)).toBe(false);
  });

  it('should check if date is in the past', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();

    expect(component.isPast(yesterday)).toBe(true);
    expect(component.isPast(tomorrow)).toBe(false);
  });

  it('should get correct status badge configuration', () => {
    const pendingBadge = component.getStatusBadge(AppointmentStatus.PENDING);
    const confirmedBadge = component.getStatusBadge(AppointmentStatus.CONFIRMED);
    const completedBadge = component.getStatusBadge(AppointmentStatus.COMPLETED);
    const cancelledBadge = component.getStatusBadge(AppointmentStatus.CANCELLED);
    const noshowBadge = component.getStatusBadge(AppointmentStatus.NOSHOW);
    const unknownBadge = component.getStatusBadge('UNKNOWN' as any);

    expect(pendingBadge.class).toBe('status-pending');
    expect(confirmedBadge.class).toBe('status-confirmed');
    expect(completedBadge.class).toBe('status-completed');
    expect(cancelledBadge.class).toBe('status-cancelled');
    expect(noshowBadge.class).toBe('status-noshow');
    expect(unknownBadge.class).toBe('status-unknown');
  });

  it('should get correct appointment icon based on status and date', () => {
    const pastAppointment = {
      ...mockAppointment,
      startTime: new Date(Date.now() - 2 * 86400000).toISOString(),
      endTime: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
    };
    const todayAppointment = { ...mockAppointment, startTime: new Date().toISOString() };

    // Past appointment that's not completed or cancelled
    expect(component.getAppointmentIcon({ ...pastAppointment, status: AppointmentStatus.CONFIRMED })).toBe('warning');

    // Today's appointment
    expect(component.getAppointmentIcon(todayAppointment)).toBe('today');

    // Status-based icons
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.PENDING })).toBe('schedule');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.CONFIRMED })).toBe('check_circle');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.COMPLETED })).toBe('done_all');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.CANCELLED })).toBe('cancel');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.NOSHOW })).toBe('no_accounts');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: 'UNKNOWN' as any })).toBe('event');
  });

  it('should refresh data', () => {
    const initialCalls = vi.mocked(dashboardService.getAppointmentsOverview).mock.calls.length;
    component.refresh();
    expect(vi.mocked(dashboardService.getAppointmentsOverview).mock.calls.length).toBe(initialCalls + 1);
  });

  it('should handle page change', () => {
    const pageEvent = new PageEvent();
    pageEvent.pageIndex = 1;
    pageEvent.pageSize = 5;
    component.onPageChange(pageEvent);

    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(5);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalled();
  });

  it('should handle sort change', () => {
    const sortEvent: Sort = {
      active: 'customerName',
      direction: 'asc',
    };

    component.onSortChange(sortEvent);

    expect(component.filters.sortField).toBe('customerName');
    expect(component.filters.sortDirection).toBe('asc');
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledWith({
      sortField: 'customerName',
      sortDirection: 'asc',
    });
  });
});
