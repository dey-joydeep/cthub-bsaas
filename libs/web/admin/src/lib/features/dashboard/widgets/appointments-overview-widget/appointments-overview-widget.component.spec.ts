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
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Appointment, AppointmentsOverview } from '../../models/appointment.model';
import { DashboardService } from '../../services/dashboard.service';
import { AppointmentsOverviewWidgetComponent } from './appointments-overview-widget.component';

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>> : T[K];
};

describe('AppointmentsOverviewWidgetComponent', () => {
  let component: AppointmentsOverviewWidgetComponent;
  let fixture: ComponentFixture<AppointmentsOverviewWidgetComponent>;
  let dashboardService: Mocked<DashboardService>;
  let translateService: Mocked<TranslateService>;
  let snackBar: jest.Mocked<MatSnackBar>;

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
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getAppointmentsOverview', 'updateAppointmentStatus']);

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
      'get',
      'use',
      'setTranslation',
      'setDefaultLang',
      'addLangs',
      'getBrowserLang',
      'getBrowserCultureLang',
      'getLangs',
      'getParser',
      'getTranslation',
      'reloadLang',
      'resetLang',
      'setTranslation',
      'stream',
      'onLangChange',
      'onTranslationChange',
      'onDefaultLangChange',
    ]);

    await TestBed.configureTestingModule({
      declarations: [AppointmentsOverviewWidgetComponent],
      imports: [
        NoopAnimationsModule,
        HttpClientTestingModule,
        RouterTestingModule,
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
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    // Create mock services with proper typing
    dashboardService = {
      getAppointmentsOverview: jest.fn().mockReturnValue(of(mockOverview)),
      updateAppointmentStatus: jest.fn().mockReturnValue(of({ ...mockAppointment, status: AppointmentStatus.COMPLETED })),
    } as unknown as Mocked<DashboardService>;

    translateService = {
      instant: jest.fn((key: string | string[]) => (typeof key === 'string' ? key : key[0])),
      get: jest.fn().mockReturnValue(of('translated')),
    } as unknown as Mocked<TranslateService>;

    snackBar = {
      open: jest.fn(),
    } as unknown as jest.Mocked<MatSnackBar>;

    // Provide the mock services
    TestBed.overrideProvider(DashboardService, { useValue: dashboardService });
    TestBed.overrideProvider(TranslateService, { useValue: translateService });
    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentsOverviewWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments overview on init', () => {
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledTimes(1);
    expect(component.overview).toEqual(mockOverview);
    expect(component.dataSource.data).toEqual(mockOverview.upcomingAppointments);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error when loading appointments overview', () => {
    const error = new Error('Failed to load');
    dashboardService.getAppointmentsOverview.mockReturnValueOnce(throwError(() => error));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.error).toBe('DASHBOARD.APPOINTMENTS.ERROR_LOADING');
    expect(component.isLoading).toBeFalse();

    const errorElement = fixture.nativeElement.querySelector('.error-container');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('DASHBOARD.APPOINTMENTS.ERROR_LOADING');
  });

  it('should filter appointments by status', () => {
    const status = AppointmentStatus.PENDING;
    component.statusFilter.setValue(status);

    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledTimes(2);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledWith({ status });
  });

  it('should filter appointments by date range', fakeAsync(() => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 86400000); // 7 days later

    component.dateRange.setValue({ start: startDate, end: endDate });
    tick(300); // Debounce time

    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledTimes(2);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledWith({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }));

  it('should update appointment status', fakeAsync(() => {
    const appointment = { ...mockAppointment };
    const newStatus = AppointmentStatus.COMPLETED;

    component.changeStatus(appointment, newStatus);
    tick(); // Wait for async operations to complete

    expect(dashboardService.updateAppointmentStatus).toHaveBeenCalledWith(appointment.id, newStatus);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();
  }));

  it('should handle error when updating appointment status', () => {
    const error = new Error('Failed to update');
    dashboardService.updateAppointmentStatus.mockReturnValueOnce(throwError(() => error));

    component.changeStatus(mockAppointment, AppointmentStatus.COMPLETED);

    expect(snackBar.open).toHaveBeenCalledTimes(1);
    expect(snackBar.open).toHaveBeenCalledWith('DASHBOARD.APPOINTMENTS.STATUS_UPDATE_ERROR', 'COMMON.CLOSE', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(30)).toBe('30m');
    expect(component.formatDuration(90)).toBe('1h 30m');
    expect(component.formatDuration(120)).toBe('2h 0m');
  });

  it('should check if date is today', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    expect(component.isToday(today)).toBeTrue();
    expect(component.isToday(yesterday)).toBeFalse();
  });

  it('should check if date is in the past', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();

    expect(component.isPast(yesterday)).toBeTrue();
    expect(component.isPast(tomorrow)).toBeFalse();
  });

  it('should get correct status badge configuration', () => {
    const pendingBadge = component.getStatusBadge(AppointmentStatus.PENDING);
    const confirmedBadge = component.getStatusBadge(AppointmentStatus.CONFIRMED);
    const completedBadge = component.getStatusBadge(AppointmentStatus.COMPLETED);
    const cancelledBadge = component.getStatusBadge(AppointmentStatus.CANCELLED);
    const noshowBadge = component.getStatusBadge(AppointmentStatus.NOSHOW);
    const unknownBadge = component.getStatusBadge('UNKNOWN' as any);

    expect(pendingBadge.text).toBe('STATUS.PENDING');
    expect(confirmedBadge.text).toBe('STATUS.CONFIRMED');
    expect(completedBadge.text).toBe('STATUS.COMPLETED');
    expect(cancelledBadge.text).toBe('STATUS.CANCELLED');
    expect(noshowBadge.text).toBe('STATUS.NO_SHOW');
    expect(unknownBadge.text).toBe('UNKNOWN');
  });

  it('should get correct appointment icon based on status and date', () => {
    const pastAppointment = { ...mockAppointment, startTime: new Date(Date.now() - 86400000).toISOString() };
    const todayAppointment = { ...mockAppointment, startTime: new Date().toISOString() };

    // Past appointment that's not completed or cancelled
    expect(component.getAppointmentIcon({ ...pastAppointment, status: AppointmentStatus.CONFIRMED })).toBe('warning');

    // Today's appointment
    expect(component.getAppointmentIcon(todayAppointment)).toBe('today');

    // Status-based icons
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.PENDING })).toBe('schedule');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.CONFIRMED })).toBe('event_available');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.COMPLETED })).toBe('done_all');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.CANCELLED })).toBe('cancel');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: AppointmentStatus.NOSHOW })).toBe('no_accounts');
    expect(component.getAppointmentIcon({ ...mockAppointment, status: 'UNKNOWN' as any })).toBe('event');
  });

  it('should refresh data', () => {
    const initialCalls = jest.mocked(dashboardService.getAppointmentsOverview).mock.calls.length;
    component.refresh();
    expect(jest.mocked(dashboardService.getAppointmentsOverview).mock.calls.length).toBe(initialCalls + 1);
  });

  it('should handle page change', fakeAsync(() => {
    const pageEvent = new PageEvent();
    pageEvent.pageIndex = 1;
    pageEvent.pageSize = 5;
    component.onPageChange(pageEvent);

    tick();

    expect(component.dataSource.paginator).toBeDefined();
    expect(component.dataSource.paginator?.pageIndex).toBe(1);
    expect(component.dataSource.paginator?.pageSize).toBe(5);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledTimes(2);
    expect(dashboardService.getAppointmentsOverview).toHaveBeenCalledWith({
      page: 2, // pageIndex + 1
      pageSize: 5,
      sortField: 'saleDate',
      sortDirection: 'desc',
    });
  }));

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
