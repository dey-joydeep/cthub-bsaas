import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { StaffServiceCatalogApi } from './staff-service-catalog.api';
import { StaffServiceCatalogComponent } from './staff-service-catalog.component';

describe('StaffServiceCatalogComponent', () => {
  let fixture: ComponentFixture<StaffServiceCatalogComponent>;
  const routeStub = {
    snapshot: { data: {} as Record<string, string> },
    parent: { snapshot: { data: {} as Record<string, string> } },
  };
  const settingsApi = {
    listBranches: vi.fn(),
  };
  const catalogApi = {
    listStaff: vi.fn(),
    createStaff: vi.fn(),
    updateStaff: vi.fn(),
    replaceStaffRoles: vi.fn(),
    replaceStaffSkills: vi.fn(),
    replaceStaffShifts: vi.fn(),
    createStaffLeaveBlock: vi.fn(),
    listServiceCategories: vi.fn(),
    createServiceCategory: vi.fn(),
    listServices: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    updateServiceStatus: vi.fn(),
    replaceServiceStaffEligibility: vi.fn(),
  };

  beforeEach(async () => {
    settingsApi.listBranches.mockReturnValue(
      of({
        items: [
          {
            id: 'branch-1',
            businessId: 'business-1',
            name: 'Main',
            timezone: 'Asia/Tokyo',
            currency: 'JPY',
            address: { line1: '1 Main St', city: 'Tokyo', state: 'Tokyo', postalCode: '1000001', country: 'JP' },
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
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
            roles: ['STYLIST'],
            skillServiceIds: ['service-1'],
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.listServiceCategories.mockReturnValue(
      of({ items: [{ id: 'category-1', name: 'Hair', sortOrder: 1 }], page: { limit: 1, nextCursor: null, hasMore: false } }),
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
            eligibleStaffIds: ['staff-1'],
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.replaceStaffRoles.mockReturnValue(of({ id: 'staff-1', roles: ['STYLIST'] }));
    catalogApi.replaceServiceStaffEligibility.mockReturnValue(of({ id: 'service-1', eligibleStaffIds: ['staff-1'] }));
    catalogApi.createStaffLeaveBlock.mockReturnValue(of({ id: 'leave-1' }));
    catalogApi.updateServiceStatus.mockReturnValue(
      of({
        id: 'service-1',
        categoryId: 'category-1',
        name: 'Cut',
        durationMinutes: 45,
        bufferMinutes: 5,
        basePrice: '35.00',
        taxRatePercent: '10.00',
        status: 'INACTIVE',
        eligibleStaffIds: ['staff-1'],
      }),
    );
    routeStub.snapshot.data = {};
    routeStub.parent.snapshot.data = {};

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, StaffServiceCatalogComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: settingsApi },
        { provide: StaffServiceCatalogApi, useValue: catalogApi },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffServiceCatalogComponent);
    fixture.detectChanges();
  });

  it('loads staff, services, categories, and branches on initialization', () => {
    expect(settingsApi.listBranches).toHaveBeenCalled();
    expect(catalogApi.listStaff).toHaveBeenCalled();
    expect(catalogApi.listServices).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Stylist One');
    expect(fixture.componentInstance['serviceForm'].controls.name.value).toBe('Cut');
  });

  it('saves selected staff roles', () => {
    const component = fixture.componentInstance as unknown as { saveRoles: () => void };
    component.saveRoles();

    expect(catalogApi.replaceStaffRoles).toHaveBeenCalledWith('staff-1', { roles: ['STYLIST'] });
  });

  it('saves selected service eligibility', () => {
    const component = fixture.componentInstance as unknown as { saveEligibility: () => void };
    component.saveEligibility();

    expect(catalogApi.replaceServiceStaffEligibility).toHaveBeenCalledWith('service-1', { staffIds: ['staff-1'] });
  });

  it('selects the services tab for the services route', () => {
    routeStub.parent.snapshot.data = { catalogTab: 'services' };
    fixture = TestBed.createComponent(StaffServiceCatalogComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as { selectedTabIndex: () => number };
    expect(component.selectedTabIndex()).toBe(1);
  });

  it('converts leave datetime-local values to UTC ISO before submit', () => {
    const component = fixture.componentInstance as unknown as {
      leaveForm: { patchValue: (value: Record<string, string>) => void };
      saveLeave: () => void;
    };
    component.leaveForm.patchValue({
      branchId: 'branch-1',
      startsAt: '2026-05-26T09:30',
      endsAt: '2026-05-26T10:30',
      reason: 'Personal',
    });

    component.saveLeave();

    expect(catalogApi.createStaffLeaveBlock).toHaveBeenCalledWith('staff-1', {
      branchId: 'branch-1',
      startsAt: new Date('2026-05-26T09:30').toISOString(),
      endsAt: new Date('2026-05-26T10:30').toISOString(),
      reason: 'Personal',
    });
  });

  it('syncs service status form after status update', () => {
    const component = fixture.componentInstance as unknown as {
      serviceForm: { controls: { status: { value: string } } };
      setServiceStatus: (status: 'ACTIVE' | 'INACTIVE') => void;
    };

    component.setServiceStatus('INACTIVE');

    expect(component.serviceForm.controls.status.value).toBe('INACTIVE');
  });
});
