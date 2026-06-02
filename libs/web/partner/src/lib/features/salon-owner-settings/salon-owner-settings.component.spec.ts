import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of, throwError } from 'rxjs';

import { BranchProfile, SalonBusiness } from './models/salon-owner-settings.models';
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
  branchForm: { patchValue(value: Partial<{ email: string }>): void; getRawValue(): { businessId: string } };
  hoursForm: { patchValue(value: Partial<{ timezone: string }>): void };
  holidayForm: {
    patchValue(value: Partial<{ date: string; closed: boolean; start: string; end: string }>): void;
    controls: { start: { errors: Record<string, unknown> | null }; end: { errors: Record<string, unknown> | null } };
  };
  policyForm: { controls: { bookingLeadMinutes: { setValue(value: number): void } } };
  businesses(): readonly SalonBusiness[];
  branches(): readonly BranchProfile[];
  selectedBranch(): BranchProfile | null;
}

describe('SalonOwnerSettingsComponent', () => {
  let fixture: ComponentFixture<SalonOwnerSettingsComponent>;
  const branch: BranchProfile = {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
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
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    api.listBranches.mockReturnValue(
      of({
        items: [branch],
        page: { limit: 1, nextCursor: null, hasMore: false },
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

  it('saves branch policy for the selected branch', () => {
    const component = fixture.componentInstance as unknown as { savePolicy: () => void };
    component.savePolicy();

    expect(api.updateBranchPolicy).toHaveBeenCalledWith('branch-1', {
      bookingLeadMinutes: 45,
      cancellationCutoffMinutes: 180,
      noShowGraceMinutes: 15,
    });
  });

  it('omits optional branch email when the field is blank', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    component.branchForm.patchValue({ email: '' });

    component.saveBranch();

    expect(api.updateBranch).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        email: undefined,
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

  it('does not submit invalid branch policy values', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;
    api.updateBranchPolicy.mockClear();
    component.policyForm.controls.bookingLeadMinutes.setValue(-1);

    component.savePolicy();

    expect(api.updateBranchPolicy).not.toHaveBeenCalled();
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

  it('requires holiday start and end times when the branch stays open', () => {
    const component = fixture.componentInstance as unknown as SettingsComponentHarness;

    component.holidayForm.patchValue({ closed: false, start: '', end: '' });

    expect(component.holidayForm.controls.start.errors).toEqual(expect.objectContaining({ required: true }));
    expect(component.holidayForm.controls.end.errors).toEqual(expect.objectContaining({ required: true }));
  });

  it('ignores stale branch-list responses after the selected business changes', () => {
    let firstRequestHandler: ((result: { items: BranchProfile[]; page: { limit: number; nextCursor: null; hasMore: false } }) => void) | undefined;
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
          page: { limit: 1, nextCursor: null, hasMore: false },
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
      page: { limit: 1, nextCursor: null, hasMore: false },
    });

    expect(component.branches()).toEqual([expect.objectContaining({ id: 'branch-2', businessId: 'business-2' })]);
  });

  it('invalidates pending branch-list responses when starting a new branch', () => {
    let firstRequestHandler: ((result: { items: BranchProfile[]; page: { limit: number; nextCursor: null; hasMore: false } }) => void) | undefined;
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
      page: { limit: 1, nextCursor: null, hasMore: false },
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
      | ((result: {
          branchId: string;
          bookingLeadMinutes: number;
          cancellationCutoffMinutes: number;
          noShowGraceMinutes: number;
        }) => void)
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
      .mockReturnValue(of({ branchId: 'branch-2', timezone: 'Asia/Tokyo', days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, open: dayOfWeek > 0, intervals: dayOfWeek > 0 ? [{ start: '10:00', end: '18:00' }] : [] })) }));
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
          page: { limit: 1, nextCursor: null, hasMore: false },
        }),
      )
      .mockReturnValueOnce(
        of({
          items: [{ ...branch, id: 'branch-2', businessId: 'business-2', name: 'Second' }],
          page: { limit: 1, nextCursor: null, hasMore: false },
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
          { dayOfWeek: 1, open: true, intervals: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
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
});
