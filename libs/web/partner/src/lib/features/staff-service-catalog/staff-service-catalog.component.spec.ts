import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { StaffServiceCatalogApi } from './staff-service-catalog.api';
import { StaffServiceCatalogComponent } from './staff-service-catalog.component';

describe('StaffServiceCatalogComponent', () => {
  let fixture: ComponentFixture<StaffServiceCatalogComponent>;
  const settingsApi = {
    listBranches: jest.fn(),
  };
  const catalogApi = {
    listStaff: jest.fn(),
    createStaff: jest.fn(),
    updateStaff: jest.fn(),
    replaceStaffRoles: jest.fn(),
    replaceStaffSkills: jest.fn(),
    replaceStaffShifts: jest.fn(),
    createStaffLeaveBlock: jest.fn(),
    listServiceCategories: jest.fn(),
    createServiceCategory: jest.fn(),
    listServices: jest.fn(),
    createService: jest.fn(),
    updateService: jest.fn(),
    updateServiceStatus: jest.fn(),
    replaceServiceStaffEligibility: jest.fn(),
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

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, StaffServiceCatalogComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: settingsApi },
        { provide: StaffServiceCatalogApi, useValue: catalogApi },
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
});
