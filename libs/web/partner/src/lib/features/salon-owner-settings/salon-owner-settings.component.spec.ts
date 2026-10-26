import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of, throwError } from 'rxjs';

import { CURRENT_USER } from '@cthub-bsaas/web-core-auth';
import { BranchHoliday, BranchProfile, HolidayFormValue, SalonBusiness } from './models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from './salon-owner-settings.api';
import { SalonOwnerSettingsComponent } from './salon-owner-settings.component';

interface SettingsComponentHarness {
  saveBranch(): void;
  saveHours(): void;
  savePolicy(): void;
  saveHoliday(): void;
  saveBusiness(): void;
  newBusiness(): void;
  selectBusiness(business: SalonBusiness): void;
  selectBranch(branch: BranchProfile): void;
  branchForm: { patchValue(value: Partial<{ email: string }>): void; getRawValue(): { businessId: string } };
  hoursForm: { patchValue(value: Partial<{ timezone: string }>): void };
  holidayForm: {
    patchValue(value: Partial<HolidayFormValue>): void;
    controls: { start: { errors: Record<string, unknown> | null }; end: { errors: Record<string, unknown> | null } };
  };
  policyForm: { controls: { bookingLeadMinutes: { setValue(value: number): void } } };
  businesses(): readonly SalonBusiness[];
  branches(): readonly BranchProfile[];
  holidays(): readonly BranchHoliday[];
  selectedBusiness(): SalonBusiness | null;
  selectedBranch(): BranchProfile | null;
  branchSettingsLoaded(): boolean;
  error(): string | null;
  message(): string | null;
}

describe('SalonOwnerSettingsComponent', () => {
  let fixture: ComponentFixture<SalonOwnerSettingsComponent>;
  const branch: BranchProfile = {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    status: 'ACTIVE',
    address: {
      line1: '1 Main St',
      city: 'Tokyo',
      state: 'Tokyo',
      postalCode: '1000001',
      country: 'JP',
    },
    createdAt: '2026-05-26T00:00:00.000Z',
    updatedAt: '2026-05-26T00:00:00.000Z',
  };
  const api = {
    listBusinesses: jest.fn(),
    listBranches: jest.fn(),
    createBusiness: jest.fn(),
    updateBusiness: jest.fn(),
    createBranch: jest.fn(),
    updateBranch: jest.fn(),
    getBranchHours: jest.fn(),
    listBranchHolidays: jest.fn(),
    getBranchPolicy: jest.fn(),
    replaceBranchHours: jest.fn(),
    setBranchHoliday: jest.fn(),
    updateBranchPolicy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    api.listBusinesses.mockReturnValue(
      of({
        items: [
          {
            id: 'business-1',
            tenantId: 'tenant-1',
            displayName: 'Salon One',
            legalName: 'Salon One Legal',
            status: 'ACTIVE',
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { page: 1, pageSize: 1, total: 1 },
      }),
    );
    api.listBranches.mockReturnValue(
      of({
        items: [branch],
        page: { page: 1, pageSize: 1, total: 1 },
      }),
    );
    api.getBranchHours.mockReturnValue(
      of({
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: dayOfWeek > 0,
          intervals: dayOfWeek > 0 ? [{ start: '09:00', end: '17:00' }] : [],
        })),
      }),
    );
    api.getBranchPolicy.mockReturnValue(
      of({
        branchId: 'branch-1',
        bookingLeadMinutes: 45,
        cancellationCutoffMinutes: 180,
        noShowGraceMinutes: 15,
      }),
    );
    api.listBranchHolidays.mockReturnValue(
      of([
        {
          branchId: 'branch-1',
          date: '2026-05-26',
          closed: true,
          reason: 'Maintenance',
          intervals: [],
        },
      ]),
    );
    api.setBranchHoliday.mockReturnValue(
      of({
        branchId: 'branch-1',
        date: '2026-05-26',
        closed: true,
        reason: 'Maintenance',
        intervals: [],
      }),
    );
    api.updateBranch.mockReturnValue(of(branch));
    api.createBusiness.mockReturnValue(
      of({
        id: 'business-2',
        tenantId: 'tenant-1',
        displayName: 'Salon Two',
        legalName: 'Salon Two Legal',
        status: 'ACTIVE',
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      }),
    );
    api.replaceBranchHours.mockReturnValue(of({ branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [] }));
    api.updateBranchPolicy.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SalonOwnerSettingsComponent],
      providers: [{ provide: SalonOwnerSettingsApi, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    fixture.detectChanges();
  });

  it('loads business and branch state on initialization', () => {
    expect(api.listBusinesses).toHaveBeenCalled();
    expect(api.listBranches).toHaveBeenCalledWith('business-1');
    expect(api.getBranchHours).toHaveBeenCalledWith('branch-1');
    expect(api.getBranchPolicy).toHaveBeenCalledWith('branch-1');
    expect(fixture.nativeElement.textContent).toContain('Salon One');
  });

  it('loads branch state directly on the branch route', () => {
    TestBed.resetTestingModule();
    api.listBusinesses.mockClear();
    api.listBranches.mockClear();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SalonOwnerSettingsComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              routeConfig: { path: 'owner/branches' },
            },
          },
        },
        {
          provide: CURRENT_USER,
          useValue: {
            currentUser$: of({ id: 'owner-1', role: 'owner' }),
            isAuthenticated$: of(true),
            redirectUrl: null,
          },
        },
      ],
    });

    const branchFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    branchFixture.detectChanges();

    expect(api.listBusinesses).not.toHaveBeenCalled();
    expect(api.listBranches).toHaveBeenCalledWith(undefined);
    expect(branchFixture.nativeElement.textContent).toContain('Branch settings');
  });

  it('shows a manager-access message when branch-route staff users are forbidden', async () => {
    TestBed.resetTestingModule();
    api.listBusinesses.mockClear();
    api.listBranches.mockReset();
    api.listBranches.mockReturnValueOnce(
      throwError(() => ({
        status: 403,
        error: { message: 'error.forbidden_scope' },
      })),
    );
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SalonOwnerSettingsComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              routeConfig: { path: 'owner/branches' },
            },
          },
        },
        {
          provide: CURRENT_USER,
          useValue: {
            currentUser$: of({ id: 'staff-1', role: 'staff' }),
            isAuthenticated$: of(true),
            redirectUrl: null,
          },
        },
      ],
    });

    const branchFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    branchFixture.detectChanges();
    await branchFixture.whenStable();
    branchFixture.detectChanges();
    const component = branchFixture.componentInstance as unknown as SettingsComponentHarness;

    expect(api.listBusinesses).not.toHaveBeenCalled();
    expect(component.error()).toBe('You need branch-manager access to manage branch settings for this business.');
  });

  it('loads businesses on the branch route when an owner has no branches yet', () => {
    TestBed.resetTestingModule();
    api.listBusinesses.mockClear();
    api.listBranches.mockReset();
    api.listBranches
      .mockReturnValueOnce(
        of({
          items: [],
          page: { page: 1, pageSize: 1, total: 0 },
        }),
      )
      .mockReturnValueOnce(
        of({
          items: [],
          page: { page: 1, pageSize: 1, total: 0 },
        }),
      );

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SalonOwnerSettingsComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              routeConfig: { path: 'owner/branches' },
            },
          },
        },
        {
          provide: CURRENT_USER,
          useValue: {
            currentUser$: of({ id: 'owner-1', role: 'owner' }),
            isAuthenticated$: of(true),
            redirectUrl: null,
          },
        },
      ],
    });

    const branchFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    branchFixture.detectChanges();
    const component = branchFixture.componentInstance as unknown as SettingsComponentHarness;

    expect(api.listBusinesses).toHaveBeenCalled();
    expect(component.branchForm.getRawValue().businessId).toBe('business-1');
  });

  it('allows creating another business after one is already selected', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(value: { displayName: string; legalName: string }): void };
    };
    api.createBusiness.mockClear();
    api.updateBusiness.mockClear();

    component.newBusiness();
    component.businessForm.patchValue({
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
    });
    component.saveBusiness();

    expect(api.createBusiness).toHaveBeenCalledWith({
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
    });
    expect(api.updateBusiness).not.toHaveBeenCalled();
  });

  it('shows a specific message when deactivating a business is blocked by active branches', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(value: { status: 'INACTIVE' }): void };
    };
    api.updateBusiness.mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'error.business.profile.status_conflict' },
      })),
    );

    component.businessForm.patchValue({ status: 'INACTIVE' });
    component.saveBusiness();

    expect(component.error()).toBe(
      'This business cannot be deactivated while it still has active branches. Archive or deactivate those branches first.',
    );
  });

  it('preserves the selected branch business id when creating from the branch route', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      newBranch(): void;
    };

    component.newBranch();

    expect(component.branchForm.getRawValue().businessId).toBe('business-1');
  });

  it('keeps branch-route reloads unfiltered after saving a branch', () => {
    TestBed.resetTestingModule();
    api.listBranches.mockClear();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SalonOwnerSettingsComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              routeConfig: { path: 'owner/branches' },
            },
          },
        },
        {
          provide: CURRENT_USER,
          useValue: {
            currentUser$: of({ id: 'owner-1', role: 'owner' }),
            isAuthenticated$: of(true),
            redirectUrl: null,
          },
        },
      ],
    });

    const branchFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    branchFixture.detectChanges();
    const component = branchFixture.componentInstance as unknown as SettingsComponentHarness;
    api.listBranches.mockClear();

    component.saveBranch();

    expect(api.listBranches).toHaveBeenCalledWith(undefined);
  });

  it('saves branch policy for the selected branch', () => {
    const component = fixture.componentInstance as unknown as { savePolicy: () => void };
    component.savePolicy();

    expect(api.updateBranchPolicy).toHaveBeenCalledWith('branch-1', {
      bookingLeadMinutes: 45,
      cancellationCutoffMinutes: 180,
      noShowGraceMinutes: 15,
    });
  });

  it('ignores stale policy-save responses after switching branches', () => {
    let saveHandler: (() => void) | undefined;
    api.updateBranchPolicy.mockReturnValueOnce(
      new Observable((subscriber) => {
        saveHandler = () => {
          subscriber.next({});
          subscriber.complete();
        };
      }),
    );
    api.getBranchHours.mockReturnValueOnce(
      of({
        branchId: 'branch-2',
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: dayOfWeek > 0,
          intervals: dayOfWeek > 0 ? [{ start: '10:00', end: '18:00' }] : [],
        })),
      }),
    );
    api.getBranchPolicy.mockReturnValueOnce(
      of({
        branchId: 'branch-2',
        bookingLeadMinutes: 60,
        cancellationCutoffMinutes: 180,
        noShowGraceMinutes: 15,
      }),
    );
    api.listBranchHolidays.mockReturnValueOnce(of([]));
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.savePolicy();
    component.selectBranch({ ...branch, id: 'branch-2', name: 'Second' });
    saveHandler?.();

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2' }));
    expect(component.message()).toBeNull();
  });

  it('shows a specific message when archiving a branch is blocked by future appointments', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      branchForm: { patchValue(value: { status: 'INACTIVE' }): void };
    };
    api.updateBranch.mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'error.branch.profile.status_conflict' },
      })),
    );

    component.branchForm.patchValue({ status: 'INACTIVE' });
    component.saveBranch();

    expect(component.error()).toBe(
      'This branch cannot be archived while it has future confirmed appointments. Move or cancel those appointments first.',
    );
  });

  it('shows a specific message when branch currency changes are blocked by a lock', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      branchForm: { patchValue(value: { currency: string }): void };
    };
    api.updateBranch.mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'error.branch.profile.currency_locked' },
      })),
    );

    component.branchForm.patchValue({ currency: 'USD' });
    component.saveBranch();

    expect(component.error()).toBe(
      'This branch currency is locked because finance history already exists. Keep the current currency for this branch.',
    );
  });

  it('shows a specific message when branch saves are blocked by an inactive business', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.updateBranch.mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'error.branch.profile.business_inactive' },
      })),
    );

    component.saveBranch();

    expect(component.error()).toBe('This business is inactive. Reactivate the business before creating a branch or reactivating one.');
  });

  it('clears optional branch email when the field is blank on update', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    component.branchForm.patchValue({ email: '' });

    component.saveBranch();

    expect(api.updateBranch).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        email: null,
        status: 'ACTIVE',
      }),
    );
  });

  it('sends explicit nulls when clearing optional branch fields on update', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      branchForm: { patchValue(value: { phone: string; email: string }): void };
    };
    component.branchForm.patchValue({ phone: '', email: '' });

    component.saveBranch();

    expect(api.updateBranch).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        phone: null,
        email: null,
      }),
    );
  });

  it('includes branch status in branch saves', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      branchForm: { patchValue(value: { status: 'INACTIVE' }): void };
    };

    component.branchForm.patchValue({ status: 'INACTIVE' });
    component.saveBranch();

    expect(api.updateBranch).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        status: 'INACTIVE',
      }),
    );
  });

  it('sends empty intervals for closed weekly-hours days', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.saveHours();

    expect(api.replaceBranchHours).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 0,
            open: false,
            intervals: [],
          }),
        ]),
      }),
    );
  });

  it('clears stale branch state when branch loading fails', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.listBranches.mockReturnValueOnce(throwError(() => new Error('failed')));

    component.selectBusiness({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    expect(component.branches()).toEqual([]);
    expect(component.selectedBranch()).toBeNull();
  });

  it('does not submit invalid branch policy values and sets error banner', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.updateBranchPolicy.mockClear();
    component.policyForm.controls.bookingLeadMinutes.setValue(-1);

    component.savePolicy();

    expect(api.updateBranchPolicy).not.toHaveBeenCalled();
    expect(component.error()).toBe('Fix validation errors on booking policies before saving.');
  });

  it('does not submit decimal or oversized policy values and sets error banner', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      policyForm: {
        patchValue(value: { bookingLeadMinutes: number; cancellationCutoffMinutes: number; noShowGraceMinutes: number }): void;
      };
    };
    api.updateBranchPolicy.mockClear();
    component.policyForm.patchValue({
      bookingLeadMinutes: 1.5,
      cancellationCutoffMinutes: 9999999999,
      noShowGraceMinutes: 10,
    });

    component.savePolicy();

    expect(api.updateBranchPolicy).not.toHaveBeenCalled();
    expect(component.error()).toBe('Fix validation errors on booking policies before saving.');
  });

  it('does not submit invalid branch timezone or currency values and displays accessible errors', async () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      branchForm: { patchValue(value: { timezone: string; currency: string }): void };
    };
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[];
    tabs.find((tab) => tab.textContent?.includes('Branches'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    api.updateBranch.mockClear();
    component.branchForm.patchValue({ timezone: 'Asia/Toky', currency: 'ZZZ' });

    component.saveBranch();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.updateBranch).not.toHaveBeenCalled();
    expect(component.error()).toBe('Fix validation errors on the branch profile before saving.');

    const errorElements = Array.from(fixture.nativeElement.querySelectorAll('mat-error')) as HTMLElement[];
    const errorTexts = errorElements.map((el) => el.textContent?.trim());
    expect(errorTexts).toContain('Enter a valid IANA timezone (e.g. Asia/Tokyo).');
    expect(errorTexts).toContain('Enter a valid 3-letter currency code (e.g. JPY, USD).');
  });

  it('does not submit invalid business profile values and displays accessible errors', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(value: { displayName: string; legalName: string }): void };
    };
    api.createBusiness.mockClear();
    api.updateBusiness.mockClear();
    component.businessForm.patchValue({ displayName: ' ', legalName: 'a' });

    component.saveBusiness();
    fixture.detectChanges();

    expect(api.createBusiness).not.toHaveBeenCalled();
    expect(api.updateBusiness).not.toHaveBeenCalled();
    expect(component.error()).toBe('Fix validation errors on the business profile before saving.');

    const errorElements = Array.from(fixture.nativeElement.querySelectorAll('mat-error')) as HTMLElement[];
    const errorTexts = errorElements.map((el) => el.textContent?.trim());
    expect(errorTexts).toContain('Display name is required (min 2 characters).');
    expect(errorTexts).toContain('Legal name is required (min 2 characters).');
  });

  it('does not submit invalid holiday or weekly-hours values', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      holidayForm: { patchValue(value: { date: string }): void };
      hoursForm: { patchValue(value: { timezone: string }): void };
      saveHoliday(): void;
    };
    api.setBranchHoliday.mockClear();
    api.replaceBranchHours.mockClear();

    component.holidayForm.patchValue({ date: '' });
    component.saveHoliday();
    component.hoursForm.patchValue({ timezone: '' });
    component.saveHours();

    expect(api.setBranchHoliday).not.toHaveBeenCalled();
    expect(api.replaceBranchHours).not.toHaveBeenCalled();
  });

  it('does not submit weekly-hours values outside the HH:MM range', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      dayForms: {
        at(index: number): {
          get(path: string): {
            at(index: number): { patchValue(value: { start?: string; end?: string }): void };
          };
        };
      };
    };
    api.replaceBranchHours.mockClear();

    component.dayForms.at(1).get('intervals').at(0).patchValue({ start: '9:00', end: '25:99' });
    component.saveHours();

    expect(api.replaceBranchHours).not.toHaveBeenCalled();
  });

  it('does not submit weekly-hours values with reversed or overlapping intervals', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      addInterval(dayIndex: number): void;
      dayForms: {
        at(index: number): {
          get(path: string): {
            at(index: number): { patchValue(value: { start?: string; end?: string }): void };
          };
        };
      };
    };
    api.replaceBranchHours.mockClear();

    component.dayForms.at(1).get('intervals').at(0).patchValue({ start: '17:00', end: '09:00' });
    component.saveHours();
    expect(api.replaceBranchHours).not.toHaveBeenCalled();
    expect(component.error()).toBe('Fix weekly hours so each interval starts before it ends and open-day intervals do not overlap.');

    component.dayForms.at(1).get('intervals').at(0).patchValue({ start: '09:00', end: '12:00' });
    component.addInterval(1);
    component.dayForms.at(1).get('intervals').at(1).patchValue({ start: '11:00', end: '13:00' });
    component.saveHours();

    expect(api.replaceBranchHours).not.toHaveBeenCalled();
    expect(component.error()).toBe('Fix weekly hours so each interval starts before it ends and open-day intervals do not overlap.');
  });

  it('does not save hours or policy while branch settings are still loading', () => {
    api.getBranchHours.mockReturnValueOnce(new Observable(() => undefined));
    api.getBranchPolicy.mockReturnValueOnce(new Observable(() => undefined));

    const loadingFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    loadingFixture.detectChanges();
    const component = loadingFixture.componentInstance as unknown as SettingsComponentHarness;
    api.replaceBranchHours.mockClear();
    api.updateBranchPolicy.mockClear();

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-1' }));
    expect(component.branchSettingsLoaded()).toBe(false);

    component.saveHours();
    component.savePolicy();

    expect(api.replaceBranchHours).not.toHaveBeenCalled();
    expect(api.updateBranchPolicy).not.toHaveBeenCalled();
  });

  it('retries hours saves with explicit acknowledgement after a conflict response', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      hoursForm: {
        controls: { acknowledgeExistingAppointmentsOutsideHours: { setValue(value: boolean): void } };
      };
      saveHours(): void;
    };
    api.replaceBranchHours
      .mockReturnValueOnce(
        throwError(() => ({
          error: { message: 'error.branch.hours.appointments_outside_hours' },
        })),
      )
      .mockReturnValueOnce(of({ branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [] }));

    component.saveHours();
    component.hoursForm.controls.acknowledgeExistingAppointmentsOutsideHours.setValue(true);
    component.saveHours();

    expect(api.replaceBranchHours).toHaveBeenNthCalledWith(
      2,
      'branch-1',
      expect.objectContaining({
        acknowledgeExistingAppointmentsOutsideHours: true,
      }),
    );
  });

  it('resets the hours acknowledgement after the schedule changes following a conflict', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      dayForms: {
        at(index: number): {
          get(path: string): {
            at(index: number): { patchValue(value: { start?: string; end?: string }): void };
          };
        };
      };
      hoursConflictRequiresAcknowledgement(): boolean;
    };
    api.replaceBranchHours.mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'error.branch.hours.appointments_outside_hours' },
      })),
    );

    component.saveHours();
    expect(component.hoursConflictRequiresAcknowledgement()).toBe(true);

    component.dayForms.at(1).get('intervals').at(0).patchValue({ end: '18:00' });

    expect(component.hoursConflictRequiresAcknowledgement()).toBe(false);
  });

  it('ignores stale hours-save conflicts after switching branches', () => {
    let hoursErrorHandler: ((error: unknown) => void) | undefined;
    api.replaceBranchHours.mockReturnValueOnce(
      new Observable((subscriber) => {
        hoursErrorHandler = (error) => subscriber.error(error);
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.saveHours();
    component.selectBranch({ ...branch, id: 'branch-2', name: 'Second' });
    hoursErrorHandler?.({
      error: { message: 'error.branch.hours.appointments_outside_hours' },
    });

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2' }));
    expect(component.error()).toBeNull();
    expect(component.message()).toBeNull();
  });

  it('requires holiday start and end times when the branch stays open', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.holidayForm.patchValue({ closed: false, start: '', end: '' });

    expect(component.holidayForm.controls.start.errors).toEqual(expect.objectContaining({ required: true }));
    expect(component.holidayForm.controls.end.errors).toEqual(expect.objectContaining({ required: true }));
  });

  it('rejects holiday times outside the HH:MM range when the branch stays open', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.holidayForm.patchValue({ closed: false, start: '24:00', end: '12:99' });

    expect(component.holidayForm.controls.start.errors).toEqual(expect.objectContaining({ pattern: expect.any(Object) }));
    expect(component.holidayForm.controls.end.errors).toEqual(expect.objectContaining({ pattern: expect.any(Object) }));
  });

  it('rejects reversed holiday intervals before saving', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.setBranchHoliday.mockClear();

    component.holidayForm.patchValue({ closed: false, start: '17:00', end: '09:00' });
    component.saveHoliday();

    expect(api.setBranchHoliday).not.toHaveBeenCalled();
    expect(component.error()).toBe('Holiday open hours must start before they end.');
  });

  it('refreshes the holiday list after saving an override', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.setBranchHoliday.mockReturnValueOnce(
      of({
        branchId: 'branch-1',
        date: '2026-12-25',
        closed: true,
        reason: 'Holiday',
        intervals: [],
      }),
    );

    component.holidayForm.patchValue({ date: '2026-12-25', closed: true, reason: 'Holiday' });
    component.saveHoliday();

    expect(component.holidays()).toEqual([
      expect.objectContaining({ date: '2026-05-26' }),
      expect.objectContaining({ date: '2026-12-25', reason: 'Holiday' }),
    ]);
  });

  it('ignores stale holiday saves after switching branches', () => {
    let saveHandler: ((savedHoliday: BranchHoliday) => void) | undefined;
    api.setBranchHoliday.mockReturnValueOnce(
      new Observable((subscriber) => {
        saveHandler = (savedHoliday) => {
          subscriber.next(savedHoliday);
          subscriber.complete();
        };
      }),
    );
    api.listBranchHolidays.mockReturnValueOnce(
      of([
        {
          branchId: 'branch-2',
          date: '2026-06-01',
          closed: true,
          reason: 'Branch Two Holiday',
          intervals: [],
        },
      ]),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      selectedHoliday(): BranchHoliday | null;
    };

    component.holidayForm.patchValue({ date: '2026-12-25', closed: true, reason: 'Branch One Holiday' });
    component.saveHoliday();
    component.selectBranch({ ...branch, id: 'branch-2', name: 'Second' });
    saveHandler?.({
      branchId: 'branch-1',
      date: '2026-12-25',
      closed: true,
      reason: 'Branch One Holiday',
      intervals: [],
    });

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2' }));
    expect(component.selectedHoliday()).toBeNull();
    expect(component.holidays()).toEqual([
      expect.objectContaining({
        branchId: 'branch-2',
        date: '2026-06-01',
        reason: 'Branch Two Holiday',
      }),
    ]);
  });

  it('preserves all existing holiday intervals when re-saving a multi-interval holiday without changing hours', () => {
    const multiIntervalHoliday: BranchHoliday = {
      branchId: 'branch-1',
      date: '2026-08-12',
      closed: false,
      reason: 'Festival',
      intervals: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    };
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      selectHoliday(holiday: BranchHoliday): void;
    };
    api.setBranchHoliday.mockClear();

    component.selectHoliday(multiIntervalHoliday);
    component.holidayForm.patchValue({ reason: 'Updated Festival' });
    component.saveHoliday();

    expect(api.setBranchHoliday).toHaveBeenCalledWith('branch-1', '2026-08-12', {
      closed: false,
      reason: 'Updated Festival',
      intervals: multiIntervalHoliday.intervals,
    });
  });

  it('blocks hour edits for multi-interval holidays until the editor supports them', () => {
    const multiIntervalHoliday: BranchHoliday = {
      branchId: 'branch-1',
      date: '2026-08-12',
      closed: false,
      reason: 'Festival',
      intervals: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    };
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      selectHoliday(holiday: BranchHoliday): void;
    };
    api.setBranchHoliday.mockClear();

    component.selectHoliday(multiIntervalHoliday);
    component.holidayForm.patchValue({ start: '10:00' });
    component.saveHoliday();

    expect(api.setBranchHoliday).not.toHaveBeenCalled();
    expect(component.error()).toBe(
      'This holiday has multiple open intervals. Change only the reason here, or recreate the holiday to edit its hours.',
    );
  });

  it('rejects weekly hours timezone changes that do not match the selected branch', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.replaceBranchHours.mockClear();

    component.hoursForm.patchValue({ timezone: 'UTC' });
    component.saveHours();

    expect(api.replaceBranchHours).not.toHaveBeenCalled();
    expect(component.error()).toBe('Weekly hours must use the selected branch timezone.');
  });

  it('allows saving after closing a day with invalid hidden intervals', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      getDayIntervals(dayIndex: number): {
        at(index: number): { patchValue(value: { start: string; end: string }): void };
        disabled: boolean;
      };
      onDayOpenToggle(dayIndex: number): void;
      hoursForm: {
        controls: {
          days: {
            at(index: number): { get(path: 'open'): { setValue(value: boolean): void } | null };
          };
        };
      };
    };
    api.replaceBranchHours.mockClear();

    component.getDayIntervals(1).at(0).patchValue({ start: '18:00', end: '09:00' });
    component.hoursForm.controls.days.at(1).get('open')?.setValue(false);
    component.onDayOpenToggle(1);
    component.saveHours();

    expect(component.getDayIntervals(1).disabled).toBe(true);
    expect(api.replaceBranchHours).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        days: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            open: false,
            intervals: [],
          }),
        ]),
      }),
    );
  });

  it('ignores stale branch-save responses after the selected business changes', () => {
    let saveHandler: ((savedBranch: BranchProfile) => void) | undefined;
    api.updateBranch.mockReturnValueOnce(
      new Observable((subscriber) => {
        saveHandler = (savedBranch) => {
          subscriber.next(savedBranch);
          subscriber.complete();
        };
      }),
    );
    api.listBranches.mockReturnValueOnce(
      of({
        items: [{ ...branch, id: 'branch-2', businessId: 'business-2', name: 'Second' }],
        page: { page: 1, pageSize: 1, total: 1 },
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.saveBranch();
    component.selectBusiness({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });
    saveHandler?.(branch);

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2', businessId: 'business-2' }));
  });

  it('ignores stale business-save responses after the selected business changes', () => {
    let saveHandler: ((savedBusiness: SalonBusiness) => void) | undefined;
    api.updateBusiness.mockReturnValueOnce(
      new Observable((subscriber) => {
        saveHandler = (savedBusiness) => {
          subscriber.next(savedBusiness);
          subscriber.complete();
        };
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(value: { displayName: string }): void };
    };

    component.businessForm.patchValue({ displayName: 'Updated One' });
    component.saveBusiness();
    component.selectBusiness({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    saveHandler?.({
      id: 'business-1',
      tenantId: 'tenant-1',
      displayName: 'Updated One',
      legalName: 'Salon One Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    expect(component.selectedBusiness()).toEqual(expect.objectContaining({ id: 'business-2' }));
  });

  it('ignores stale business-list reloads after the selected business changes', () => {
    let reloadHandler: ((result: { items: SalonBusiness[]; page: { page: number; pageSize: number; total: number } }) => void) | undefined;
    api.updateBusiness.mockReturnValueOnce(
      of({
        id: 'business-1',
        tenantId: 'tenant-1',
        displayName: 'Updated One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      }),
    );
    api.listBusinesses.mockReturnValueOnce(
      new Observable((subscriber) => {
        reloadHandler = (result) => {
          subscriber.next(result);
          subscriber.complete();
        };
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(value: { displayName: string }): void };
    };

    component.businessForm.patchValue({ displayName: 'Updated One' });
    component.saveBusiness();
    component.selectBusiness({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    reloadHandler?.({
      items: [
        {
          id: 'business-1',
          tenantId: 'tenant-1',
          displayName: 'Updated One',
          legalName: 'Salon One Legal',
          status: 'ACTIVE',
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
        {
          id: 'business-2',
          tenantId: 'tenant-1',
          displayName: 'Salon Two',
          legalName: 'Salon Two Legal',
          status: 'ACTIVE',
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
      page: { page: 1, pageSize: 2, total: 2 },
    });

    expect(component.selectedBusiness()).toEqual(expect.objectContaining({ id: 'business-2' }));
  });

  it('ignores stale business-create responses after restarting a new business draft', () => {
    let createHandler: ((savedBusiness: SalonBusiness) => void) | undefined;
    api.createBusiness.mockReturnValueOnce(
      new Observable((subscriber) => {
        createHandler = (savedBusiness) => {
          subscriber.next(savedBusiness);
          subscriber.complete();
        };
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(value: { displayName: string; legalName: string }): void };
    };

    component.newBusiness();
    component.businessForm.patchValue({
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
    });
    component.saveBusiness();
    component.newBusiness();

    createHandler?.({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    expect(component.selectedBusiness()).toBeNull();
  });

  it('ignores stale branch-save responses after switching branches in the same business', () => {
    let saveHandler: ((savedBranch: BranchProfile) => void) | undefined;
    api.updateBranch.mockReturnValueOnce(
      new Observable((subscriber) => {
        saveHandler = (savedBranch) => {
          subscriber.next(savedBranch);
          subscriber.complete();
        };
      }),
    );
    api.listBranches.mockReturnValueOnce(
      of({
        items: [branch, { ...branch, id: 'branch-2', name: 'Second' }],
        page: { page: 1, pageSize: 2, total: 2 },
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.saveBranch();
    component.selectBranch({ ...branch, id: 'branch-2', name: 'Second' });
    saveHandler?.(branch);

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2' }));
  });

  it('ignores stale branch-list reloads after switching branches', () => {
    let reloadHandler: ((result: { items: BranchProfile[]; page: { page: number; pageSize: number; total: number } }) => void) | undefined;
    api.updateBranch.mockReturnValueOnce(of(branch));
    api.listBranches.mockReturnValueOnce(
      new Observable((subscriber) => {
        reloadHandler = (result) => {
          subscriber.next(result);
          subscriber.complete();
        };
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.saveBranch();
    component.selectBranch({ ...branch, id: 'branch-2', name: 'Second' });
    reloadHandler?.({
      items: [branch, { ...branch, id: 'branch-2', name: 'Second' }],
      page: { page: 1, pageSize: 2, total: 2 },
    });

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2' }));
  });

  it('ignores stale branch-create responses after restarting a new branch draft', () => {
    let createHandler: ((savedBranch: BranchProfile) => void) | undefined;
    api.createBranch.mockReturnValueOnce(
      new Observable((subscriber) => {
        createHandler = (savedBranch) => {
          subscriber.next(savedBranch);
          subscriber.complete();
        };
      }),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      newBranch(): void;
      branchForm: {
        patchValue(value: {
          name: string;
          timezone: string;
          currency: string;
          address: {
            line1: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          };
        }): void;
      };
    };

    component.newBranch();
    component.branchForm.patchValue({
      name: 'Annex',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      address: {
        line1: '2 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000002',
        country: 'JP',
      },
    });
    component.saveBranch();
    component.newBranch();

    createHandler?.({
      ...branch,
      id: 'branch-2',
      name: 'Annex',
    });

    expect(component.selectedBranch()).toBeNull();
  });

  it('ignores stale branch-list responses after the selected business changes', () => {
    let firstRequestHandler:
      | ((result: { items: BranchProfile[]; page: { page: number; pageSize: number; total: number } }) => void)
      | undefined;
    api.listBranches
      .mockReturnValueOnce(
        new Observable((subscriber) => {
          firstRequestHandler = (result) => {
            subscriber.next(result);
            subscriber.complete();
          };
        }),
      )
      .mockReturnValueOnce(
        of({
          items: [
            {
              ...branch,
              id: 'branch-2',
              businessId: 'business-2',
              name: 'Second',
            },
          ],
          page: { page: 1, pageSize: 1, total: 1 },
        }),
      );

    const staleFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    staleFixture.detectChanges();
    const component = staleFixture.componentInstance as unknown as SettingsComponentHarness;
    component.selectBusiness({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });
    firstRequestHandler?.({
      items: [branch],
      page: { page: 1, pageSize: 1, total: 1 },
    });

    expect(component.branches()).toEqual([expect.objectContaining({ id: 'branch-2', businessId: 'business-2' })]);
  });

  it('invalidates pending branch-list responses when starting a new branch', () => {
    let firstRequestHandler:
      | ((result: { items: BranchProfile[]; page: { page: number; pageSize: number; total: number } }) => void)
      | undefined;
    api.listBranches.mockReturnValueOnce(
      new Observable((subscriber) => {
        firstRequestHandler = (result) => {
          subscriber.next(result);
          subscriber.complete();
        };
      }),
    );

    const staleFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    staleFixture.detectChanges();
    const component = staleFixture.componentInstance as unknown as SettingsComponentHarness & { newBranch(): void };

    component.newBranch();

    firstRequestHandler?.({
      items: [branch],
      page: { page: 1, pageSize: 1, total: 1 },
    });

    expect(component.selectedBranch()).toBeNull();
    expect(component.branches()).toEqual([]);
    expect(component.branchForm.getRawValue().businessId).toBe('business-1');
  });

  it('invalidates stale branch-settings responses after switching businesses', () => {
    let firstHoursHandler:
      | ((result: {
          branchId: string;
          timezone: string;
          days: { dayOfWeek: number; open: boolean; intervals: { start: string; end: string }[] }[];
        }) => void)
      | undefined;
    let firstPolicyHandler:
      | ((result: { branchId: string; bookingLeadMinutes: number; cancellationCutoffMinutes: number; noShowGraceMinutes: number }) => void)
      | undefined;

    api.getBranchHours
      .mockReturnValueOnce(
        new Observable((subscriber) => {
          firstHoursHandler = (result) => {
            subscriber.next(result);
            subscriber.complete();
          };
        }),
      )
      .mockReturnValue(
        of({
          branchId: 'branch-2',
          timezone: 'Asia/Tokyo',
          days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            open: dayOfWeek > 0,
            intervals: dayOfWeek > 0 ? [{ start: '10:00', end: '18:00' }] : [],
          })),
        }),
      );
    api.getBranchPolicy
      .mockReturnValueOnce(
        new Observable((subscriber) => {
          firstPolicyHandler = (result) => {
            subscriber.next(result);
            subscriber.complete();
          };
        }),
      )
      .mockReturnValue(of({ branchId: 'branch-2', bookingLeadMinutes: 90, cancellationCutoffMinutes: 240, noShowGraceMinutes: 20 }));
    api.listBranches
      .mockReturnValueOnce(
        of({
          items: [branch],
          page: { page: 1, pageSize: 1, total: 1 },
        }),
      )
      .mockReturnValueOnce(
        of({
          items: [{ ...branch, id: 'branch-2', businessId: 'business-2', name: 'Second' }],
          page: { page: 1, pageSize: 1, total: 1 },
        }),
      );

    const staleFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    staleFixture.detectChanges();
    const component = staleFixture.componentInstance as unknown as SettingsComponentHarness & {
      hoursForm: { getRawValue(): { timezone: string } };
      policyForm: { getRawValue(): { bookingLeadMinutes: number } };
    };

    component.selectBusiness({
      id: 'business-2',
      tenantId: 'tenant-1',
      displayName: 'Salon Two',
      legalName: 'Salon Two Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    firstHoursHandler?.({
      branchId: 'branch-1',
      timezone: 'UTC',
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        open: dayOfWeek > 0,
        intervals: dayOfWeek > 0 ? [{ start: '01:00', end: '02:00' }] : [],
      })),
    });
    firstPolicyHandler?.({
      branchId: 'branch-1',
      bookingLeadMinutes: 5,
      cancellationCutoffMinutes: 15,
      noShowGraceMinutes: 1,
    });

    expect(component.selectedBranch()).toEqual(expect.objectContaining({ id: 'branch-2' }));
    expect(component.hoursForm.getRawValue().timezone).toBe('Asia/Tokyo');
    expect(component.policyForm.getRawValue().bookingLeadMinutes).toBe(90);
  });

  it('renders every saved hours interval', async () => {
    api.getBranchHours.mockReturnValueOnce(
      of({
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [
          { dayOfWeek: 0, open: false, intervals: [] },
          {
            dayOfWeek: 1,
            open: true,
            intervals: [
              { start: '09:00', end: '12:00' },
              { start: '13:00', end: '17:00' },
            ],
          },
          ...[2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, open: true, intervals: [{ start: '09:00', end: '17:00' }] })),
        ],
      }),
    );

    const splitFixture = TestBed.createComponent(SalonOwnerSettingsComponent);
    splitFixture.detectChanges();
    await splitFixture.whenStable();

    const tabs = Array.from(splitFixture.nativeElement.querySelectorAll('[role="tab"]')) as HTMLElement[];
    tabs.find((tab) => tab.textContent?.includes('Hours'))?.click();
    splitFixture.detectChanges();
    await splitFixture.whenStable();

    expect(splitFixture.nativeElement.querySelectorAll('.interval-row')).toHaveLength(7);
  });

  it('loads existing holidays for the selected branch', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    expect(api.listBranchHolidays).toHaveBeenCalledWith('branch-1');
    expect(component.holidays()).toEqual([
      expect.objectContaining({
        date: '2026-05-26',
        reason: 'Maintenance',
      }),
    ]);
  });

  it('clears the selected holiday draft when switching branches', () => {
    api.listBranchHolidays.mockReturnValueOnce(
      of([
        {
          branchId: 'branch-2',
          date: '2026-06-02',
          closed: true,
          reason: 'Branch Two Holiday',
          intervals: [],
        },
      ]),
    );
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      selectHoliday(holiday: BranchHoliday): void;
      selectedHoliday(): BranchHoliday | null;
      holidayForm: {
        getRawValue(): { date: string; closed: boolean; reason: string; start: string; end: string };
      };
    };
    const holiday: BranchHoliday = {
      branchId: 'branch-1',
      date: '2026-08-12',
      closed: false,
      reason: 'Festival',
      intervals: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    };

    component.selectHoliday(holiday);
    component.selectBranch({ ...branch, id: 'branch-2', name: 'Second' });

    expect(component.selectedHoliday()).toBeNull();
    expect(component.holidayForm.getRawValue()).toEqual({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      closed: true,
      reason: '',
      start: '09:00',
      end: '17:00',
    });
    expect(component.holidays()).toEqual([
      expect.objectContaining({
        branchId: 'branch-2',
        date: '2026-06-02',
        reason: 'Branch Two Holiday',
      }),
    ]);
  });

  it('allows adding and removing hours intervals from the form array', () => {
    const component = fixture.componentInstance as unknown as {
      addInterval(dayIndex: number): void;
      removeInterval(dayIndex: number, intervalIndex: number): void;
      getDayIntervals(dayIndex: number): { length: number };
    };

    expect(component.getDayIntervals(1).length).toBe(1);

    component.addInterval(1);
    expect(component.getDayIntervals(1).length).toBe(2);

    component.removeInterval(1, 1);
    expect(component.getDayIntervals(1).length).toBe(1);
  });

  it('marks required text fields invalid when filled only with whitespace', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: {
        controls: {
          displayName: { setValue(val: string): void; errors: Record<string, unknown> | null; valid: boolean };
          legalName: { setValue(val: string): void; errors: Record<string, unknown> | null; valid: boolean };
        };
        invalid: boolean;
      };
      branchForm: {
        controls: {
          name: { setValue(val: string): void; errors: Record<string, unknown> | null; valid: boolean };
          address: {
            controls: {
              line1: { setValue(val: string): void; errors: Record<string, unknown> | null; valid: boolean };
              city: { setValue(val: string): void; errors: Record<string, unknown> | null; valid: boolean };
            };
          };
        };
        invalid: boolean;
      };
    };

    component.businessForm.controls.displayName.setValue('   ');
    expect(component.businessForm.controls.displayName.errors).toEqual(expect.objectContaining({ required: true }));
    expect(component.businessForm.controls.displayName.valid).toBe(false);

    component.businessForm.controls.displayName.setValue(' a ');
    expect(component.businessForm.controls.displayName.errors).toEqual(
      expect.objectContaining({ minlength: { requiredLength: 2, actualLength: 1 } }),
    );

    component.businessForm.controls.legalName.setValue('   ');
    expect(component.businessForm.controls.legalName.errors).toEqual(expect.objectContaining({ required: true }));

    component.branchForm.controls.name.setValue('   ');
    expect(component.branchForm.controls.name.errors).toEqual(expect.objectContaining({ required: true }));

    component.branchForm.controls.address.controls.line1.setValue('   ');
    expect(component.branchForm.controls.address.controls.line1.errors).toEqual(expect.objectContaining({ required: true }));

    api.updateBusiness.mockClear();
    component.saveBusiness();
    expect(api.updateBusiness).not.toHaveBeenCalled();
  });

  it('preserves the active branch selection when an existing business is saved in a multi-branch business', () => {
    const branch2: BranchProfile = { ...branch, id: 'branch-2', name: 'Second Branch' };
    api.listBranches.mockReturnValue(
      of({
        items: [branch, branch2],
        page: { page: 1, pageSize: 2, total: 2 },
      }),
    );
    api.updateBusiness.mockReturnValue(
      of({
        id: 'business-1',
        displayName: 'Updated Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
      }),
    );

    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(val: { displayName: string }): void };
    };

    component.selectBranch(branch2);
    expect(component.selectedBranch()?.id).toBe('branch-2');

    api.listBranches.mockClear();
    component.businessForm.patchValue({ displayName: 'Updated Salon One' });
    component.saveBusiness();

    expect(api.updateBusiness).toHaveBeenCalledWith('business-1', {
      displayName: 'Updated Salon One',
      legalName: 'Salon One Legal',
      status: 'ACTIVE',
    });
    expect(api.listBranches).toHaveBeenCalledWith('business-1');
    expect(component.selectedBranch()?.id).toBe('branch-2');
  });

  it('preserves a branch draft started while a business save or reload is in flight', () => {
    let businessSaveSubscriber: ((business: SalonBusiness) => void) | undefined;
    api.updateBusiness.mockReturnValueOnce(
      new Observable((subscriber) => {
        businessSaveSubscriber = (business) => {
          subscriber.next(business);
          subscriber.complete();
        };
      }),
    );

    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      newBranch(): void;
      businessForm: { patchValue(val: { displayName: string }): void };
    };

    component.businessForm.patchValue({ displayName: 'In-Flight Business Save' });
    component.saveBusiness();

    // User starts a new branch draft while the business save is in flight
    component.newBranch();
    expect(component.selectedBranch()).toBeNull();

    // Now business save completes
    businessSaveSubscriber?.({
      id: 'business-1',
      displayName: 'In-Flight Business Save',
      legalName: 'Salon One Legal',
      status: 'ACTIVE',
    });

    // Branch draft should remain active (selectedBranch stays null)
    expect(component.selectedBranch()).toBeNull();
  });

  it('seeds the branch business id after creating a business so new branches can be saved', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness & {
      businessForm: { patchValue(val: { displayName: string; legalName: string }): void };
      branchForm: {
        getRawValue(): { businessId: string };
        patchValue(
          val: Partial<{ name: string; address: { line1: string; city: string; state: string; postalCode: string; country: string } }>,
        ): void;
      };
    };

    api.createBusiness.mockReturnValueOnce(
      of({
        id: 'new-business-123',
        tenantId: 'tenant-1',
        displayName: 'Newly Created Salon',
        legalName: 'Newly Created Salon Legal',
        status: 'ACTIVE',
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      }),
    );
    api.listBusinesses.mockReturnValueOnce(
      of({
        items: [
          {
            id: 'new-business-123',
            tenantId: 'tenant-1',
            displayName: 'Newly Created Salon',
            legalName: 'Newly Created Salon Legal',
            status: 'ACTIVE',
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { page: 1, pageSize: 1, total: 1 },
      }),
    );
    api.listBranches.mockReturnValueOnce(
      of({
        items: [],
        page: { page: 1, pageSize: 0, total: 0 },
      }),
    );
    api.createBranch.mockClear();
    api.createBranch.mockReturnValueOnce(
      of({
        ...branch,
        id: 'new-branch-1',
        businessId: 'new-business-123',
        name: 'First Branch',
      }),
    );

    component.newBusiness();
    component.businessForm.patchValue({
      displayName: 'Newly Created Salon',
      legalName: 'Newly Created Salon Legal',
    });
    component.saveBusiness();

    expect(component.selectedBusiness()?.id).toBe('new-business-123');
    expect(component.branchForm.getRawValue().businessId).toBe('new-business-123');

    component.branchForm.patchValue({
      name: 'First Branch',
      address: {
        line1: '123 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    });
    component.saveBranch();

    expect(api.createBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'new-business-123',
        name: 'First Branch',
      }),
    );
  });
});
