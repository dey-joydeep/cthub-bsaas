import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CustomerCrmApi } from '../customer-crm/customer-crm.api';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { StaffServiceCatalogApi } from '../staff-service-catalog/staff-service-catalog.api';
import { AppointmentSchedulingApi } from './appointment-scheduling.api';
import { AppointmentSchedulingComponent } from './appointment-scheduling.component';

describe('AppointmentSchedulingComponent', () => {
  let fixture: ComponentFixture<AppointmentSchedulingComponent>;
  const settingsApi = { listBranches: jest.fn() };
  const customerApi = { searchCustomers: jest.fn() };
  const catalogApi = { listStaff: jest.fn(), listServices: jest.fn() };
  const appointmentApi = {
    getDayBoard: jest.fn(),
    findSlots: jest.fn(),
    createAppointment: jest.fn(),
    createWalkInAppointment: jest.fn(),
    rescheduleAppointment: jest.fn(),
    confirmAppointment: jest.fn(),
    cancelAppointment: jest.fn(),
    markAppointmentNoShow: jest.fn(),
    markAppointmentArrived: jest.fn(),
    startAppointmentService: jest.fn(),
    completeAppointment: jest.fn(),
  };

  beforeEach(async () => {
    settingsApi.listBranches.mockReturnValue(
      of({
        items: [{ id: 'branch-1', businessId: 'business-1', name: 'Main', timezone: 'Asia/Tokyo', currency: 'JPY', address: {}, createdAt: '', updatedAt: '' }],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    customerApi.searchCustomers.mockReturnValue(
      of({ items: [{ id: 'customer-1', displayName: 'Customer One', phone: '09000000001', consentForMarketing: false, createdAt: '', updatedAt: '' }], page: { limit: 1, nextCursor: null, hasMore: false } }),
    );
    catalogApi.listStaff.mockReturnValue(
      of({ items: [{ id: 'staff-1', branchIds: ['branch-1'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE', roles: [], skillServiceIds: [], createdAt: '', updatedAt: '' }], page: { limit: 1, nextCursor: null, hasMore: false } }),
    );
    catalogApi.listServices.mockReturnValue(
      of({ items: [{ id: 'service-1', categoryId: 'category-1', name: 'Cut', durationMinutes: 45, bufferMinutes: 5, basePrice: '35.00', taxRatePercent: '10.00', status: 'ACTIVE', eligibleStaffIds: [] }], page: { limit: 1, nextCursor: null, hasMore: false } }),
    );
    appointmentApi.findSlots.mockReturnValue(
      of({ items: [{ staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z', endsAt: '2026-05-26T09:50:00.000Z' }], page: { limit: 1, nextCursor: null, hasMore: false } }),
    );
    appointmentApi.getDayBoard.mockReturnValue(of({ branchId: 'branch-1', date: '2026-05-26', appointments: [] }));
    appointmentApi.createAppointment.mockReturnValue(of({ id: 'appointment-1', branchId: 'branch-1', customerId: 'customer-1', status: 'BOOKED', lines: [], createdAt: '', updatedAt: '' }));
    appointmentApi.confirmAppointment.mockReturnValue(of({ id: 'appointment-1', branchId: 'branch-1', customerId: 'customer-1', status: 'CONFIRMED', lines: [], createdAt: '', updatedAt: '' }));

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

  it('creates appointments from the current form state', () => {
    const component = fixture.componentInstance as unknown as {
      appointmentForm: { patchValue: (value: Record<string, string>) => void };
      createAppointment: () => void;
    };
    component.appointmentForm.patchValue({ startsAt: '2026-05-26T09:00:00.000Z' });
    component.createAppointment();

    expect(appointmentApi.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: 'branch-1',
        customerId: 'customer-1',
        lines: [{ serviceId: 'service-1', staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z' }],
      }),
    );
  });
});
