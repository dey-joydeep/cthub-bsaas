import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { BranchProfile, SalonBusiness } from './models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from './salon-owner-settings.api';
import { SalonOwnerSettingsComponent } from './salon-owner-settings.component';

interface SettingsComponentHarness {
  saveBranch(): void;
  saveHours(): void;
  savePolicy(): void;
  selectBusiness(business: SalonBusiness): void;
  branchForm: { patchValue(value: Partial<{ email: string }>): void };
  policyForm: { controls: { bookingLeadMinutes: { setValue(value: number): void } } };
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
    api.updateBranch.mockReturnValue(of(branch));
    api.replaceBranchHours.mockReturnValue(of({ timezone: 'Asia/Tokyo', days: [] }));
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
    expect(fixture.nativeElement.textContent).toContain('Salon One');
  });

  it('saves branch policy for the selected branch', () => {
    const component = fixture.componentInstance as unknown as { savePolicy: () => void };
    component.savePolicy();

    expect(api.updateBranchPolicy).toHaveBeenCalledWith('branch-1', {
      bookingLeadMinutes: 30,
      cancellationCutoffMinutes: 120,
      noShowGraceMinutes: 10,
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
});
