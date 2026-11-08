import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { StaffLeaveBlock } from './models/staff-service-catalog.models';
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
    listRoles: vi.fn(),
    listPermissions: vi.fn(),
    createStaff: vi.fn(),
    updateStaff: vi.fn(),
    replaceStaffRoles: vi.fn(),
    replaceStaffSkills: vi.fn(),
    replaceStaffShifts: vi.fn(),
    listStaffLeaveBlocks: vi.fn(),
    createStaffLeaveBlock: vi.fn(),
    deleteStaffLeaveBlock: vi.fn(),
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
    catalogApi.listRoles.mockReturnValue(
      of({
        items: [
          {
            id: 'role-stylist',
            businessId: 'business-1',
            roleCode: 'STYLIST',
            name: 'Stylist & Hair Artist',
            description: 'Hair styling and treatments',
            permissions: ['appointments.assigned.manage'],
            isSystemDefault: true,
            isActive: true,
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
          {
            id: 'role-owner',
            businessId: 'business-1',
            roleCode: 'OWNER',
            name: 'Owner & General Manager',
            description: 'Full administrative access',
            permissions: ['salon.business.manage'],
            isSystemDefault: true,
            isActive: true,
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { limit: 10, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.listPermissions.mockReturnValue(
      of([
        {
          code: 'appointments.assigned.manage',
          name: 'Assigned Appointments',
          category: 'Appointments',
          description: 'Manage chair appointments',
        },
        { code: 'salon.business.manage', name: 'Manage Business', category: 'Settings', description: 'Manage business settings' },
      ]),
    );
    catalogApi.replaceStaffRoles.mockReturnValue(of({ id: 'staff-1', roles: ['STYLIST'] }));
    catalogApi.replaceServiceStaffEligibility.mockReturnValue(of({ id: 'service-1', eligibleStaffIds: ['staff-1'] }));
    catalogApi.listStaffLeaveBlocks.mockReturnValue(
      of({
        items: [
          {
            id: 'leave-1',
            businessId: 'business-1',
            staffId: 'staff-1',
            branchId: 'branch-1',
            startsAt: '2026-05-26T09:30:00.000Z',
            endsAt: '2026-05-26T10:30:00.000Z',
            reason: 'Personal',
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { limit: 10, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.createStaffLeaveBlock.mockReturnValue(
      of({
        id: 'leave-1',
        businessId: 'business-1',
        staffId: 'staff-1',
        branchId: 'branch-1',
        startsAt: '2026-05-26T09:30:00.000Z',
        endsAt: '2026-05-26T10:30:00.000Z',
        reason: 'Personal',
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      }),
    );
    catalogApi.deleteStaffLeaveBlock.mockReturnValue(of({ success: true }));
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

    expect(catalogApi.replaceStaffRoles).toHaveBeenCalledWith('staff-1', { roleIds: ['role-stylist'], roles: ['STYLIST'] });
  });

  it('displays dynamic business roles and capabilities guide for selected staff', () => {
    const component = fixture.componentInstance as unknown as {
      selectedStaffSubTabIndex: { set: (idx: number) => void };
    };
    component.selectedStaffSubTabIndex.set(1);
    fixture.detectChanges();

    expect(catalogApi.listRoles).toHaveBeenCalled();
    expect(catalogApi.listPermissions).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Stylist & Hair Artist');
    expect(fixture.nativeElement.textContent).toContain('Assigned Appointments');
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

  it('loads leave blocks when staff is selected', () => {
    expect(catalogApi.listStaffLeaveBlocks).toHaveBeenCalledWith('staff-1');
    const component = fixture.componentInstance as unknown as {
      leaveBlocks: () => readonly { id: string; reason: string }[];
      selectedStaffSubTabIndex: { set: (idx: number) => void };
    };
    component.selectedStaffSubTabIndex.set(3);
    fixture.detectChanges();

    expect(component.leaveBlocks().length).toBe(1);
    expect(component.leaveBlocks()[0].reason).toBe('Personal');
    expect(fixture.nativeElement.textContent).toContain('Personal');
  });

  it('creates a salon-wide leave block with null branchId and reloads leave list', () => {
    const component = fixture.componentInstance as unknown as {
      leaveForm: { patchValue: (value: Record<string, unknown>) => void };
      saveLeave: () => void;
    };
    catalogApi.listStaffLeaveBlocks.mockClear();

    component.leaveForm.patchValue({
      branchId: null,
      startsAt: '2026-06-01T09:00',
      endsAt: '2026-06-01T17:00',
      reason: 'Salon-wide vacation',
    });

    component.saveLeave();

    expect(catalogApi.createStaffLeaveBlock).toHaveBeenCalledWith('staff-1', {
      branchId: null,
      startsAt: new Date('2026-06-01T09:00').toISOString(),
      endsAt: new Date('2026-06-01T17:00').toISOString(),
      reason: 'Salon-wide vacation',
    });
    expect(catalogApi.listStaffLeaveBlocks).toHaveBeenCalledWith('staff-1');
  });

  it('deletes a leave block, resets message, and refreshes the leave blocks list', () => {
    const component = fixture.componentInstance as unknown as {
      deleteLeave: (leaveBlockId: string) => void;
      message: () => string | null;
    };
    catalogApi.listStaffLeaveBlocks.mockClear();

    component.deleteLeave('leave-1');

    expect(catalogApi.deleteStaffLeaveBlock).toHaveBeenCalledWith('staff-1', 'leave-1');
    expect(catalogApi.listStaffLeaveBlocks).toHaveBeenCalledWith('staff-1');
    expect(component.message()).toBeNull();
  });

  it('displays a 409 conflict error when deactivating or removing OWNER role from the last active owner', () => {
    const component = fixture.componentInstance as unknown as {
      saveStaff: () => void;
      saveRoles: () => void;
      error: () => string | null;
    };

    catalogApi.updateStaff.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'Cannot deactivate or remove the OWNER role from the last active owner of the business.' },
      })),
    );
    component.saveStaff();
    expect(component.error()).toBe('Cannot deactivate or remove the OWNER role from the last active owner of the business.');

    catalogApi.replaceStaffRoles.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'Cannot deactivate or remove the OWNER role from the last active owner of the business.' },
      })),
    );
    component.saveRoles();
    expect(component.error()).toBe('Cannot deactivate or remove the OWNER role from the last active owner of the business.');
  });

  it('renders mat-error in DOM and displays error banner when submitting invalid staffForm', () => {
    catalogApi.updateStaff.mockClear();
    catalogApi.createStaff.mockClear();

    const component = fixture.componentInstance as unknown as {
      staffForm: { controls: { displayName: { setValue: (val: string) => void }; phone: { setValue: (val: string) => void } } };
      saveStaff: () => void;
      error: () => string | null;
    };

    component.staffForm.controls.displayName.setValue('');
    component.saveStaff();
    fixture.detectChanges();

    expect(component.error()).toBe('Please correct the highlighted fields before saving.');
    expect(catalogApi.updateStaff).not.toHaveBeenCalled();
    expect(catalogApi.createStaff).not.toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorBanner = compiled.querySelector('.salon-banner-error');
    expect(errorBanner?.textContent).toContain('Please correct the highlighted fields before saving.');

    const matError = compiled.querySelector('mat-error');
    expect(matError).not.toBeNull();
    expect(matError?.textContent).toContain('Display name is required (min 2 characters).');
  });

  it('flags incomplete phone number "+81-90-" with pattern error, renders mat-error, and blocks save', () => {
    catalogApi.updateStaff.mockClear();
    catalogApi.createStaff.mockClear();

    const component = fixture.componentInstance;
    component.staffForm.controls.phone.setValue('+81-90-');
    expect(component.staffForm.controls.phone.hasError('pattern')).toBe(true);

    component.saveStaff();
    fixture.detectChanges();

    expect(component.error()).toBe('Please correct the highlighted fields before saving.');
    expect(catalogApi.updateStaff).not.toHaveBeenCalled();
    expect(catalogApi.createStaff).not.toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const matErrors = compiled.querySelectorAll('mat-error');
    const hasPhoneError = Array.from(matErrors).some((el) => el.textContent?.includes('Enter a valid phone number'));
    expect(hasPhoneError).toBe(true);
  });

  it('renders mat-error in DOM and displays error banner when submitting invalid serviceForm', () => {
    catalogApi.updateService.mockClear();
    catalogApi.createService.mockClear();

    routeStub.parent.snapshot.data = { catalogTab: 'services' };
    const servFixture = TestBed.createComponent(StaffServiceCatalogComponent);
    servFixture.detectChanges();

    const component = servFixture.componentInstance as unknown as {
      serviceForm: { controls: { name: { setValue: (val: string) => void } } };
      saveService: () => void;
      error: () => string | null;
    };

    component.serviceForm.controls.name.setValue('');
    component.saveService();
    servFixture.detectChanges();

    expect(component.error()).toBe('Please correct the highlighted fields before saving.');
    expect(catalogApi.updateService).not.toHaveBeenCalled();
    expect(catalogApi.createService).not.toHaveBeenCalled();

    const compiled = servFixture.nativeElement as HTMLElement;
    const errorBanner = compiled.querySelector('.salon-banner-error');
    expect(errorBanner?.textContent).toContain('Please correct the highlighted fields before saving.');

    const matErrors = compiled.querySelectorAll('mat-error');
    const hasNameError = Array.from(matErrors).some((el) => el.textContent?.includes('Service name is required'));
    expect(hasNameError).toBe(true);
  });
});

describe('StaffServiceCatalogComponent - Full Workflow Testing with Realistic Dummy Data', () => {
  let dummyFixture: ComponentFixture<StaffServiceCatalogComponent>;
  let dummyComponent: StaffServiceCatalogComponent;

  const dummyBranches = [
    {
      id: 'branch-tokyo-shibuya',
      businessId: 'biz-lumiere',
      name: 'Tokyo Shibuya Flagship',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      address: { line1: '1-2-3 Shibuya', city: 'Tokyo', state: 'Tokyo', postalCode: '150-0002', country: 'JP' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'branch-osaka-namba',
      businessId: 'biz-lumiere',
      name: 'Osaka Namba Studio',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      address: { line1: '4-5-6 Namba', city: 'Osaka', state: 'Osaka', postalCode: '542-0076', country: 'JP' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const dummyStaff = [
    {
      id: 'staff-elena-owner',
      branchIds: ['branch-tokyo-shibuya', 'branch-osaka-namba'],
      displayName: 'Elena Vance (Owner)',
      phone: '+81-90-1111-2222',
      email: 'elena@lumiere-salon.jp',
      status: 'ACTIVE' as const,
      roles: ['OWNER'],
      skillServiceIds: ['svc-precision-cut', 'svc-balayage'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'staff-kenji-manager',
      branchIds: ['branch-tokyo-shibuya'],
      displayName: 'Kenji Sato (Branch Manager)',
      phone: '+81-90-3333-4444',
      email: 'kenji@lumiere-salon.jp',
      status: 'ACTIVE' as const,
      roles: ['MANAGER', 'STYLIST'],
      skillServiceIds: ['svc-precision-cut'],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'staff-yuki-stylist',
      branchIds: ['branch-osaka-namba'],
      displayName: 'Yuki Tanaka (Senior Stylist)',
      phone: '+81-90-5555-6666',
      email: 'yuki@lumiere-salon.jp',
      status: 'ACTIVE' as const,
      roles: ['STYLIST'],
      skillServiceIds: ['svc-balayage'],
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  let dummyLeaveBlocksState: Record<string, StaffLeaveBlock[]> = {};

  const dummyCategories = [
    { id: 'cat-cuts', name: 'Precision Cuts & Styling', sortOrder: 1 },
    { id: 'cat-color', name: 'Color & Treatments', sortOrder: 2 },
  ];

  const dummyServices = [
    {
      id: 'svc-precision-cut',
      categoryId: 'cat-cuts',
      name: 'Precision Master Haircut & Style',
      durationMinutes: 60,
      bufferMinutes: 10,
      basePrice: '85.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE' as const,
      eligibleStaffIds: ['staff-elena-owner', 'staff-kenji-manager'],
    },
    {
      id: 'svc-balayage',
      categoryId: 'cat-color',
      name: 'Full Balayage Master Color',
      durationMinutes: 180,
      bufferMinutes: 15,
      basePrice: '250.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE' as const,
      eligibleStaffIds: ['staff-elena-owner', 'staff-yuki-stylist'],
    },
  ];

  const routeStub = {
    snapshot: { data: {} as Record<string, string> },
    parent: { snapshot: { data: {} as Record<string, string> } },
  };
  const settingsApi = {
    listBranches: vi.fn(),
  };
  const catalogApi = {
    listStaff: vi.fn(),
    listRoles: vi.fn(),
    listPermissions: vi.fn(),
    createStaff: vi.fn(),
    updateStaff: vi.fn(),
    replaceStaffRoles: vi.fn(),
    replaceStaffSkills: vi.fn(),
    replaceStaffShifts: vi.fn(),
    listStaffLeaveBlocks: vi.fn(),
    createStaffLeaveBlock: vi.fn(),
    deleteStaffLeaveBlock: vi.fn(),
    listServiceCategories: vi.fn(),
    createServiceCategory: vi.fn(),
    listServices: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    updateServiceStatus: vi.fn(),
    replaceServiceStaffEligibility: vi.fn(),
  };

  beforeEach(async () => {
    dummyLeaveBlocksState = {
      'staff-elena-owner': [
        {
          id: 'leave-elena-global',
          businessId: 'biz-lumiere',
          staffId: 'staff-elena-owner',
          branchId: null,
          startsAt: '2026-07-01T09:00:00.000Z',
          endsAt: '2026-07-07T18:00:00.000Z',
          reason: 'Global Beauty Expo in Paris',
          createdAt: '2026-01-10T00:00:00.000Z',
          updatedAt: '2026-01-10T00:00:00.000Z',
        },
      ],
      'staff-kenji-manager': [
        {
          id: 'leave-kenji-shibuya',
          businessId: 'biz-lumiere',
          staffId: 'staff-kenji-manager',
          branchId: 'branch-tokyo-shibuya',
          startsAt: '2026-06-15T10:00:00.000Z',
          endsAt: '2026-06-15T15:00:00.000Z',
          reason: 'Tokyo Equipment Maintenance',
          createdAt: '2026-01-11T00:00:00.000Z',
          updatedAt: '2026-01-11T00:00:00.000Z',
        },
      ],
      'staff-yuki-stylist': [],
    };

    settingsApi.listBranches.mockReturnValue(of({ items: dummyBranches, page: { limit: 10, nextCursor: null, hasMore: false } }));
    catalogApi.listStaff.mockReturnValue(of({ items: dummyStaff, page: { limit: 10, nextCursor: null, hasMore: false } }));
    catalogApi.listServiceCategories.mockReturnValue(of({ items: dummyCategories, page: { limit: 10, nextCursor: null, hasMore: false } }));
    catalogApi.listServices.mockReturnValue(of({ items: dummyServices, page: { limit: 10, nextCursor: null, hasMore: false } }));
    catalogApi.listRoles.mockReturnValue(
      of({
        items: [
          {
            id: 'role-owner',
            businessId: 'biz-lumiere',
            roleCode: 'OWNER',
            name: 'Owner & General Manager',
            description: 'Full salon authority',
            permissions: ['salon.business.manage'],
            isSystemDefault: true,
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'role-manager',
            businessId: 'biz-lumiere',
            roleCode: 'MANAGER',
            name: 'Branch Manager',
            description: 'Operations management',
            permissions: ['salon.branch.manage'],
            isSystemDefault: true,
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'role-stylist',
            businessId: 'biz-lumiere',
            roleCode: 'STYLIST',
            name: 'Stylist & Hair Artist',
            description: 'Hair service delivery',
            permissions: ['appointments.assigned.manage'],
            isSystemDefault: true,
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        page: { limit: 10, nextCursor: null, hasMore: false },
      }),
    );
    catalogApi.listPermissions.mockReturnValue(
      of([
        { code: 'salon.business.manage', name: 'Manage Business', category: 'Settings', description: 'Business settings' },
        { code: 'salon.branch.manage', name: 'Manage Branches', category: 'Settings', description: 'Branch settings' },
        { code: 'appointments.assigned.manage', name: 'Assigned Bookings', category: 'Appointments', description: 'Chair bookings' },
      ]),
    );

    catalogApi.listStaffLeaveBlocks.mockImplementation((staffId: string) => {
      const items = dummyLeaveBlocksState[staffId] ?? [];
      return of({ items, page: { limit: 10, nextCursor: null, hasMore: false } });
    });

    catalogApi.createStaffLeaveBlock.mockImplementation(
      (staffId: string, input: { branchId?: string | null; startsAt: string; endsAt: string; reason: string }) => {
        const newBlock: StaffLeaveBlock = {
          id: `leave-new-${Date.now()}`,
          businessId: 'biz-lumiere',
          staffId,
          branchId: input.branchId ?? null,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          reason: input.reason,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dummyLeaveBlocksState[staffId] = [...(dummyLeaveBlocksState[staffId] ?? []), newBlock];
        return of(newBlock);
      },
    );

    catalogApi.deleteStaffLeaveBlock.mockImplementation((staffId: string, leaveBlockId: string) => {
      dummyLeaveBlocksState[staffId] = (dummyLeaveBlocksState[staffId] ?? []).filter((b) => b.id !== leaveBlockId);
      return of({ success: true });
    });

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, StaffServiceCatalogComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: settingsApi },
        { provide: StaffServiceCatalogApi, useValue: catalogApi },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    dummyFixture = TestBed.createComponent(StaffServiceCatalogComponent);
    dummyFixture.detectChanges();
    dummyComponent = dummyFixture.componentInstance;
  });

  it('renders multi-branch salon state and Elena Vance with her salon-wide leave block', () => {
    const text = dummyFixture.nativeElement.textContent;
    expect(text).toContain('Elena Vance (Owner)');
    expect(text).toContain('Kenji Sato (Branch Manager)');
    expect(text).toContain('Yuki Tanaka (Senior Stylist)');

    const internal = dummyComponent as unknown as {
      selectedStaff: () => (typeof dummyStaff)[0] | null;
      leaveBlocks: () => readonly StaffLeaveBlock[];
      leaveBranchScope: (branchId: string | null) => string;
    };
    expect(internal.selectedStaff()?.id).toBe('staff-elena-owner');
    expect(internal.leaveBlocks().length).toBe(1);
    expect(internal.leaveBlocks()[0].reason).toBe('Global Beauty Expo in Paris');
    expect(internal.leaveBranchScope(internal.leaveBlocks()[0].branchId)).toBe('All Branches');
  });

  it('switches staff to Kenji Sato and displays his Tokyo branch-specific leave', () => {
    const internal = dummyComponent as unknown as {
      selectStaff: (member: (typeof dummyStaff)[0]) => void;
      selectedStaff: () => (typeof dummyStaff)[0] | null;
      leaveBlocks: () => readonly StaffLeaveBlock[];
      leaveBranchScope: (branchId: string | null) => string;
    };

    internal.selectStaff(dummyStaff[1]);
    dummyFixture.detectChanges();

    expect(internal.selectedStaff()?.displayName).toBe('Kenji Sato (Branch Manager)');
    expect(internal.leaveBlocks().length).toBe(1);
    expect(internal.leaveBlocks()[0].reason).toBe('Tokyo Equipment Maintenance');
    expect(internal.leaveBranchScope(internal.leaveBlocks()[0].branchId)).toBe('Tokyo Shibuya Flagship');
  });

  it('switches staff to Yuki Tanaka who starts with no leave blocks', () => {
    const internal = dummyComponent as unknown as {
      selectStaff: (member: (typeof dummyStaff)[0]) => void;
      leaveBlocks: () => readonly StaffLeaveBlock[];
      selectedStaffSubTabIndex: { set: (idx: number) => void };
    };

    internal.selectStaff(dummyStaff[2]);
    internal.selectedStaffSubTabIndex.set(3);
    dummyFixture.detectChanges();

    expect(internal.leaveBlocks().length).toBe(0);
    expect(dummyFixture.nativeElement.textContent).toContain('No active leave blocks scheduled for this staff member.');
  });

  it('creates a new salon-wide vacation for Yuki Tanaka and updates active leave blocks', () => {
    const internal = dummyComponent as unknown as {
      selectStaff: (member: (typeof dummyStaff)[0]) => void;
      leaveForm: { patchValue: (value: Record<string, unknown>) => void };
      saveLeave: () => void;
      leaveBlocks: () => readonly StaffLeaveBlock[];
      leaveBranchScope: (branchId: string | null) => string;
    };

    internal.selectStaff(dummyStaff[2]);
    dummyFixture.detectChanges();

    internal.leaveForm.patchValue({
      branchId: null,
      startsAt: '2026-08-01T09:00',
      endsAt: '2026-08-05T18:00',
      reason: 'Annual Summer Vacation',
    });

    internal.saveLeave();
    dummyFixture.detectChanges();

    expect(catalogApi.createStaffLeaveBlock).toHaveBeenCalledWith('staff-yuki-stylist', {
      branchId: null,
      startsAt: new Date('2026-08-01T09:00').toISOString(),
      endsAt: new Date('2026-08-05T18:00').toISOString(),
      reason: 'Annual Summer Vacation',
    });

    expect(internal.leaveBlocks().length).toBe(1);
    expect(internal.leaveBlocks()[0].reason).toBe('Annual Summer Vacation');
    expect(internal.leaveBranchScope(internal.leaveBlocks()[0].branchId)).toBe('All Branches');
  });

  it('deletes Elena Vance global leave block and updates leave list', () => {
    const internal = dummyComponent as unknown as {
      deleteLeave: (leaveBlockId: string) => void;
      leaveBlocks: () => readonly StaffLeaveBlock[];
    };

    expect(internal.leaveBlocks().length).toBe(1);

    internal.deleteLeave('leave-elena-global');
    dummyFixture.detectChanges();

    expect(catalogApi.deleteStaffLeaveBlock).toHaveBeenCalledWith('staff-elena-owner', 'leave-elena-global');
    expect(internal.leaveBlocks().length).toBe(0);
  });

  it('enforces BR-ST-11 owner protection when deactivating sole active owner Elena', () => {
    const internal = dummyComponent as unknown as {
      staffForm: { patchValue: (value: Record<string, unknown>) => void };
      saveStaff: () => void;
      roleForm: { patchValue: (value: Record<string, unknown>) => void };
      saveRoles: () => void;
      error: () => string | null;
    };

    catalogApi.updateStaff.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'Cannot deactivate or remove the OWNER role from the last active owner of the business.' },
      })),
    );

    internal.staffForm.patchValue({ status: 'INACTIVE' });
    internal.saveStaff();
    dummyFixture.detectChanges();

    expect(internal.error()).toBe('Cannot deactivate or remove the OWNER role from the last active owner of the business.');

    catalogApi.replaceStaffRoles.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'Cannot deactivate or remove the OWNER role from the last active owner of the business.' },
      })),
    );

    internal.roleForm.patchValue({ roles: ['STYLIST'] });
    internal.saveRoles();
    dummyFixture.detectChanges();

    expect(internal.error()).toBe('Cannot deactivate or remove the OWNER role from the last active owner of the business.');
  });

  it('filters staff members in master sidebar by search query', () => {
    const internal = dummyComponent as unknown as {
      staffSearchTerm: { set: (val: string) => void };
      filteredStaff: () => typeof dummyStaff;
    };

    expect(internal.filteredStaff().length).toBe(3);

    internal.staffSearchTerm.set('Kenji');
    dummyFixture.detectChanges();

    const filtered = internal.filteredStaff();
    expect(filtered.length).toBe(1);
    expect(filtered[0].displayName).toBe('Kenji Sato (Branch Manager)');

    internal.staffSearchTerm.set('nonexistent');
    dummyFixture.detectChanges();
    expect(internal.filteredStaff().length).toBe(0);
    expect(dummyFixture.nativeElement.textContent).toContain('No staff members match the selected criteria.');
  });

  it('filters staff members in master sidebar by branch selection', () => {
    const internal = dummyComponent as unknown as {
      staffBranchFilter: { set: (val: string) => void };
      filteredStaff: () => typeof dummyStaff;
    };

    internal.staffBranchFilter.set('branch-tokyo-shibuya');
    dummyFixture.detectChanges();

    const filtered = internal.filteredStaff();
    expect(filtered.length).toBe(2);
    expect(filtered.some((m) => m.displayName.includes('Elena'))).toBe(true);
    expect(filtered.some((m) => m.displayName.includes('Kenji'))).toBe(true);
    expect(filtered.some((m) => m.displayName.includes('Yuki'))).toBe(false);
  });

  it('auto-inherits branch timezone when shift branch selection changes', () => {
    const internal = dummyComponent as unknown as {
      shiftForm: {
        controls: {
          branchId: { setValue: (val: string) => void; value: string };
          timezone: { value: string };
        };
      };
    };

    internal.shiftForm.controls.branchId.setValue('branch-osaka-namba');
    dummyFixture.detectChanges();

    expect(internal.shiftForm.controls.timezone.value).toBe('Asia/Tokyo');
  });
});
