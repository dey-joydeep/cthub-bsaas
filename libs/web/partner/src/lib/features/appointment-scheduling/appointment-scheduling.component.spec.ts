import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CustomerCrmApi } from '../customer-crm/customer-crm.api';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { StaffServiceCatalogApi } from '../staff-service-catalog/staff-service-catalog.api';
import { AppointmentSchedulingApi } from './appointment-scheduling.api';
import { AppointmentSchedulingComponent } from './appointment-scheduling.component';

describe('AppointmentSchedulingComponent', () => {
  let fixture: ComponentFixture<AppointmentSchedulingComponent>;
  const appointment = {
    id: 'appointment-1',
    branchId: 'branch-1',
    customerId: 'customer-1',
    status: 'BOOKED',
    lines: [
      {
        id: 'line-1',
        serviceId: 'selected-service',
        staffId: 'selected-staff',
        startsAt: '2026-05-26T09:00:00.000Z',
        endsAt: '2026-05-26T09:50:00.000Z',
        serviceName: 'Color',
        staffName: 'Stylist Two',
        durationMinutes: 50,
      },
    ],
    createdAt: '',
    updatedAt: '',
  };
  const settingsApi = { listBranches: vi.fn() };
  const customerApi = { searchCustomers: vi.fn() };
  const catalogApi = { listStaff: vi.fn(), listServices: vi.fn() };
  const appointmentApi = {
    getDayBoard: vi.fn(),
    findSlots: vi.fn(),
    createAppointment: vi.fn(),
    createWalkInAppointment: vi.fn(),
    rescheduleAppointment: vi.fn(),
    confirmAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
    markAppointmentNoShow: vi.fn(),
    markAppointmentArrived: vi.fn(),
    startAppointmentService: vi.fn(),
    completeAppointment: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    settingsApi.listBranches.mockReturnValue(
      of({
        items: [
          {
            id: 'branch-1',
            businessId: 'business-1',
            name: 'Main',
            timezone: 'Asia/Tokyo',
            currency: 'JPY',
            address: {},
            createdAt: '',
            updatedAt: '',
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    customerApi.searchCustomers.mockReturnValue(
      of({
        items: [
          { id: 'customer-1', displayName: 'Customer One', phone: '09000000001', consentForMarketing: false, createdAt: '', updatedAt: '' },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.listStaff.mockReturnValue(
      of({
        items: [
          {
            id: 'staff-1',
            branchIds: ['branch-1'],
            displayName: 'Stylist One',
            phone: '09000000001',
            status: 'ACTIVE',
            roles: [],
            skillServiceIds: [],
            createdAt: '',
            updatedAt: '',
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.listServices.mockReturnValue(
      of({
        items: [
          {
            id: 'service-1',
            categoryId: 'category-1',
            name: 'Cut',
            durationMinutes: 45,
            bufferMinutes: 5,
            basePrice: '35.00',
            taxRatePercent: '10.00',
            status: 'ACTIVE',
            eligibleStaffIds: [],
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    appointmentApi.findSlots.mockReturnValue(
      of({
        items: [{ staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z', endsAt: '2026-05-26T09:50:00.000Z' }],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    appointmentApi.getDayBoard.mockReturnValue(of({ branchId: 'branch-1', date: '2026-05-26', appointments: [] }));
    appointmentApi.createAppointment.mockReturnValue(
      of({
        id: 'appointment-1',
        branchId: 'branch-1',
        customerId: 'customer-1',
        status: 'BOOKED',
        lines: [],
        createdAt: '',
        updatedAt: '',
      }),
    );
    appointmentApi.createWalkInAppointment.mockReturnValue(
      of({
        id: 'appointment-1',
        branchId: 'branch-1',
        customerId: 'customer-1',
        status: 'BOOKED',
        lines: [],
        createdAt: '',
        updatedAt: '',
      }),
    );
    appointmentApi.rescheduleAppointment.mockReturnValue(of(appointment));
    appointmentApi.confirmAppointment.mockReturnValue(
      of({
        id: 'appointment-1',
        branchId: 'branch-1',
        customerId: 'customer-1',
        status: 'CONFIRMED',
        lines: [],
        createdAt: '',
        updatedAt: '',
      }),
    );
    appointmentApi.cancelAppointment.mockReturnValue(of({ ...appointment, status: 'CANCELLED' }));
    appointmentApi.markAppointmentNoShow.mockReturnValue(of({ ...appointment, status: 'NO_SHOW' }));

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AppointmentSchedulingComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: settingsApi },
        { provide: CustomerCrmApi, useValue: customerApi },
        { provide: StaffServiceCatalogApi, useValue: catalogApi },
        { provide: AppointmentSchedulingApi, useValue: appointmentApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentSchedulingComponent);
    fixture.detectChanges();
  });

  it('loads scheduling reference data', () => {
    expect(settingsApi.listBranches).toHaveBeenCalled();
    expect(customerApi.searchCustomers).toHaveBeenCalled();
    expect(catalogApi.listServices).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Appointments');
  });

  it('finds slots from the current form state', () => {
    const component = fixture.componentInstance as unknown as { findSlots: () => void };
    component.findSlots();

    expect(appointmentApi.findSlots).toHaveBeenCalledWith('branch-1', ['service-1'], expect.any(String));
  });

  it('initializes the board with a local calendar date', () => {
    const component = fixture.componentInstance as unknown as {
      boardForm: { controls: { date: { value: string } } };
    };

    expect(component.boardForm.controls.date.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('creates appointments from branch-local date time input', () => {
    const component = fixture.componentInstance as unknown as {
      appointmentForm: { patchValue: (value: Record<string, string>) => void };
      createAppointment: () => void;
    };
    component.appointmentForm.patchValue({ startsAt: '2026-05-26T09:00' });
    component.createAppointment();

    expect(appointmentApi.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: 'branch-1',
        customerId: 'customer-1',
        lines: [{ serviceId: 'service-1', staffId: 'staff-1', startsAt: '2026-05-26T00:00:00.000Z' }],
      }),
    );
  });

  it('creates walk-ins from branch-local date time input', () => {
    const component = fixture.componentInstance as unknown as {
      appointmentForm: { patchValue: (value: Record<string, string>) => void };
      createWalkIn: () => void;
    };
    component.appointmentForm.patchValue({ startsAt: '2026-05-26T09:00' });
    component.createWalkIn();

    expect(appointmentApi.createWalkInAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: 'branch-1',
        customerId: 'customer-1',
        lines: [{ serviceId: 'service-1', staffId: 'staff-1', startsAt: '2026-05-26T00:00:00.000Z' }],
      }),
    );
  });

  it('reschedules using line identity from the selected appointment', () => {
    const component = fixture.componentInstance as unknown as {
      appointmentForm: { patchValue: (value: Record<string, string>) => void };
      rescheduleForm: { patchValue: (value: Record<string, string>) => void };
      selectedAppointment: { set: (value: unknown) => void };
      reschedule: () => void;
    };
    component.appointmentForm.patchValue({ serviceId: 'form-service', staffId: 'form-staff' });
    component.rescheduleForm.patchValue({ startsAt: '2026-05-27T10:00', reason: 'Customer request' });
    component.selectedAppointment.set(appointment);

    component.reschedule();

    expect(appointmentApi.rescheduleAppointment).toHaveBeenCalledWith('appointment-1', {
      reason: 'Customer request',
      lines: [{ serviceId: 'selected-service', staffId: 'selected-staff', startsAt: '2026-05-27T01:00:00.000Z' }],
    });
  });

  it('requires and submits lifecycle reasons for cancel and no-show', () => {
    const component = fixture.componentInstance as unknown as {
      lifecycleReasonForm: { patchValue: (value: Record<string, string>) => void };
      selectedAppointment: { set: (value: unknown) => void };
      runAction: (action: 'cancel' | 'no-show') => void;
    };
    component.selectedAppointment.set(appointment);

    component.runAction('cancel');

    expect(appointmentApi.cancelAppointment).not.toHaveBeenCalled();

    component.lifecycleReasonForm.patchValue({ reason: 'Customer called' });
    component.runAction('cancel');
    component.runAction('no-show');

    expect(appointmentApi.cancelAppointment).toHaveBeenCalledWith('appointment-1', 'Customer called');
    expect(appointmentApi.markAppointmentNoShow).toHaveBeenCalledWith('appointment-1', 'Customer called');
  });
});
