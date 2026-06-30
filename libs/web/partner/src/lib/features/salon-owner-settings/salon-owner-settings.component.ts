import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';

import { CURRENT_USER } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';

import { BranchHoliday, BranchHours, BranchPolicy, BranchProfile, SalonBusiness, WeeklyHoursDay } from './models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from './salon-owner-settings.api';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const defaultPolicy: Omit<BranchPolicy, 'branchId'> = {
  bookingLeadMinutes: 30,
  cancellationCutoffMinutes: 120,
  noShowGraceMinutes: 10,
};
const maxInt32 = 2147483647;
const supportedCurrencyCodes = new Set(
  ((Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('currency') ?? []).map((code) =>
    code.toUpperCase(),
  ),
);

function localDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isSupportedTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function timezoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return typeof value === 'string' && value.length > 0 && isSupportedTimezone(value) ? null : { timezone: true };
  };
}

function currencyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.toUpperCase() : '';
    if (!/^[A-Z]{3}$/.test(value)) {
      return { currency: true };
    }
    if (supportedCurrencyCodes.size > 0 && !supportedCurrencyCodes.has(value)) {
      return { currency: true };
    }
    return null;
  };
}

function nonNegativeIntValidator(max = maxInt32): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
      return { integerRange: true };
    }
    return null;
  };
}

function intervalsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const intervals = control.value;
    if (!Array.isArray(intervals)) {
      return { intervals: true };
    }

    const normalized = intervals
      .map((interval) => {
        const start = typeof interval?.start === 'string' ? interval.start : '';
        const end = typeof interval?.end === 'string' ? interval.end : '';
        if (!timePattern.test(start) || !timePattern.test(end)) {
          return null;
        }
        return {
          start,
          end,
          startMinutes: Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5)),
          endMinutes: Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5)),
        };
      })
      .filter((interval): interval is NonNullable<typeof interval> => interval !== null)
      .sort((left, right) => left.startMinutes - right.startMinutes);

    for (let index = 0; index < normalized.length; index += 1) {
      const current = normalized[index];
      if (current.startMinutes >= current.endMinutes) {
        return { intervalOrder: true };
      }

      const previous = normalized[index - 1];
      if (previous && previous.endMinutes > current.startMinutes) {
        return { intervalOverlap: true };
      }
    }

    return null;
  };
}

function holidayIntervalValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as { closed?: boolean; start?: string; end?: string } | null;
    if (!value || value.closed !== false) {
      return null;
    }

    const start = typeof value.start === 'string' ? value.start : '';
    const end = typeof value.end === 'string' ? value.end : '';
    if (!timePattern.test(start) || !timePattern.test(end)) {
      return null;
    }

    const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5));
    const endMinutes = Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5));
    return startMinutes < endMinutes ? null : { intervalOrder: true };
  };
}

@Component({
  selector: 'lib-salon-owner-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
  templateUrl: './salon-owner-settings.component.html',
  styleUrls: ['./salon-owner-settings.component.scss'],
})
export class SalonOwnerSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SalonOwnerSettingsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly currentUser = inject(CURRENT_USER, { optional: true });
  private businessLoadVersion = 0;
  private businessEditorVersion = 0;
  private branchLoadVersion = 0;
  private branchSettingsLoadVersion = 0;
  private businessSaveVersion = 0;
  private branchEditorVersion = 0;
  private branchSaveVersion = 0;
  private hoursSaveVersion = 0;
  private holidaySaveVersion = 0;
  private policySaveVersion = 0;
  private readonly branchRouteMode = this.route?.parent?.routeConfig?.path === 'owner/branches';
  private readonly currentRole = toSignal(this.currentUser?.currentUser$ ?? of(null), {
    initialValue: null,
  });

  protected readonly weekdays = weekdays;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly businesses = signal<readonly SalonBusiness[]>([]);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly holidays = signal<readonly BranchHoliday[]>([]);
  protected readonly selectedBusiness = signal<SalonBusiness | null>(null);
  protected readonly selectedBranch = signal<BranchProfile | null>(null);
  protected readonly selectedHoliday = signal<BranchHoliday | null>(null);
  protected readonly branchSettingsLoaded = signal(false);
  protected readonly hoursConflictRequiresAcknowledgement = signal(false);
  protected readonly branchOnlyMode = computed(() => this.branchRouteMode);
  protected readonly isStaffUser = computed(() => this.currentRole()?.role?.toLowerCase() === UserRole.STAFF);
  protected readonly hasBusiness = computed(() => this.businesses().length > 0);
  protected readonly hasBranch = computed(() => this.branches().length > 0);
  protected readonly canAccessBranches = computed(() => this.branchOnlyMode() || this.hasBusiness());
  protected readonly canCreateBusiness = computed(() => !this.branchOnlyMode());
  protected readonly canCreateBranch = computed(() => !this.branchOnlyMode() || !this.isStaffUser());

  protected readonly businessForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    legalName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    status: this.fb.nonNullable.control<'ACTIVE' | 'INACTIVE'>('ACTIVE', Validators.required),
  });

  protected readonly branchForm = this.fb.nonNullable.group({
    businessId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', Validators.maxLength(30)],
    email: ['', Validators.email],
    timezone: ['Asia/Tokyo', [Validators.required, timezoneValidator()]],
    currency: ['JPY', [Validators.required, currencyValidator()]],
    status: this.fb.nonNullable.control<'ACTIVE' | 'INACTIVE'>('ACTIVE', Validators.required),
    address: this.fb.nonNullable.group({
      line1: ['', [Validators.required, Validators.maxLength(160)]],
      line2: ['', Validators.maxLength(160)],
      city: ['', [Validators.required, Validators.maxLength(80)]],
      state: ['', [Validators.required, Validators.maxLength(80)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      country: ['JP', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    }),
  });

  protected readonly hoursForm = this.fb.nonNullable.group({
    timezone: ['Asia/Tokyo', [Validators.required, timezoneValidator(), (control: AbstractControl) => this.validateSelectedBranchTimezone(control)]],
    acknowledgeExistingAppointmentsOutsideHours: [false],
    days: this.fb.array(weekdays.map((_, dayOfWeek) => this.createDayGroup(dayOfWeek))),
  });

  protected readonly holidayForm = this.fb.nonNullable.group({
    date: [localDateInputValue(), Validators.required],
    closed: [true],
    reason: ['', Validators.maxLength(160)],
    start: ['09:00'],
    end: ['17:00'],
  }, { validators: [holidayIntervalValidator()] });

  protected readonly policyForm = this.fb.nonNullable.group({
    bookingLeadMinutes: [defaultPolicy.bookingLeadMinutes, [Validators.required, nonNegativeIntValidator()]],
    cancellationCutoffMinutes: [defaultPolicy.cancellationCutoffMinutes, [Validators.required, nonNegativeIntValidator()]],
    noShowGraceMinutes: [defaultPolicy.noShowGraceMinutes, [Validators.required, nonNegativeIntValidator()]],
  });

  constructor() {
    this.holidayForm.controls.closed.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((closed) => {
      this.updateHolidayTimeValidators(closed);
    });
    this.hoursForm.controls.timezone.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetHoursConflictAcknowledgement();
    });
    this.dayForms.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetHoursConflictAcknowledgement();
    });
    this.updateHolidayTimeValidators(this.holidayForm.controls.closed.value);
    this.loadInitialState();
  }

  protected get dayForms(): FormArray {
    return this.hoursForm.controls.days;
  }

  protected selectBusiness(business: SalonBusiness): void {
    this.businessLoadVersion += 1;
    this.businessEditorVersion += 1;
    this.branchEditorVersion += 1;
    this.selectedBusiness.set(business);
    this.branchSettingsLoadVersion += 1;
    this.branches.set([]);
    this.businessForm.reset({
      displayName: business.displayName,
      legalName: business.legalName,
      status: business.status,
    });
    this.newBranch();
    this.loadBranches(business.id);
  }

  protected selectBranch(branch: BranchProfile): void {
    this.branchLoadVersion += 1;
    this.branchEditorVersion += 1;
    this.hoursSaveVersion += 1;
    this.holidaySaveVersion += 1;
    this.policySaveVersion += 1;
    this.selectedBranch.set(branch);
    this.selectedHoliday.set(null);
    this.branchSettingsLoaded.set(false);
    this.branchForm.reset({
      businessId: branch.businessId,
      name: branch.name,
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      timezone: branch.timezone,
      currency: branch.currency,
      status: branch.status,
      address: {
        line1: branch.address.line1,
        line2: branch.address.line2 ?? '',
        city: branch.address.city,
        state: branch.address.state,
        postalCode: branch.address.postalCode,
        country: branch.address.country,
      },
    });
    this.holidayForm.reset({
      date: localDateInputValue(),
      closed: true,
      reason: '',
      start: '09:00',
      end: '17:00',
    });
    this.updateHolidayTimeValidators(this.holidayForm.controls.closed.value);
    this.loadBranchSettings(branch);
  }

  protected newBusiness(): void {
    this.businessLoadVersion += 1;
    this.businessEditorVersion += 1;
    this.branchEditorVersion += 1;
    this.selectedBusiness.set(null);
    this.selectedBranch.set(null);
    this.branches.set([]);
    this.branchLoadVersion += 1;
    this.branchSettingsLoadVersion += 1;
    this.businessForm.reset({
      displayName: '',
      legalName: '',
      status: 'ACTIVE',
    });
    this.newBranch();
  }

  protected newBranch(): void {
    this.branchEditorVersion += 1;
    this.policySaveVersion += 1;
    const businessId = this.selectedBusiness()?.id ?? this.selectedBranch()?.businessId ?? '';
    this.branchLoadVersion += 1;
    this.resetBranchEditor(businessId);
  }

  protected saveBusiness(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedBusiness();
    const startedBusinessId = selected?.id ?? null;
    const startedEditorVersion = this.businessEditorVersion;
    const requestVersion = ++this.businessSaveVersion;
    const request = selected
      ? this.api.updateBusiness(selected.id, this.businessForm.getRawValue())
      : this.api.createBusiness(this.businessForm.getRawValue());

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: (business) => {
        if (
          (this.selectedBusiness()?.id ?? null) !== startedBusinessId ||
          requestVersion !== this.businessSaveVersion ||
          startedEditorVersion !== this.businessEditorVersion
        ) {
          this.saving.set(false);
          return;
        }
        this.selectedBusiness.set(business);
        this.loadBusinesses(business.id);
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: (error: unknown) => {
        if (
          (this.selectedBusiness()?.id ?? null) !== startedBusinessId ||
          requestVersion !== this.businessSaveVersion ||
          startedEditorVersion !== this.businessEditorVersion
        ) {
          this.saving.set(false);
          return;
        }
        if (this.isBusinessDeactivationConflictError(error)) {
          this.error.set('This business cannot be deactivated while it still has active branches. Archive or deactivate those branches first.');
          this.saving.set(false);
          return;
        }

        this.error.set('Settings could not be saved.');
        this.saving.set(false);
      },
    });
  }

  protected saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedBranch();
    const value = this.branchForm.getRawValue();
    const startedBranchId = selected?.id ?? null;
    const startedBusinessId = this.selectedBusiness()?.id ?? value.businessId ?? null;
    const startedEditorVersion = this.branchEditorVersion;
    const requestVersion = ++this.branchSaveVersion;
    const input = {
      ...value,
      phone: selected ? optionalTextOrNull(value.phone) : optionalText(value.phone),
      email: selected ? optionalTextOrNull(value.email) : optionalText(value.email),
      address: {
        ...value.address,
        line2: selected ? optionalTextOrNull(value.address.line2) : optionalText(value.address.line2),
      },
    };
    const request = selected ? this.api.updateBranch(selected.id, input) : this.api.createBranch(input);

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: (branch) => {
        if (
          requestVersion !== this.branchSaveVersion ||
          (this.selectedBusiness()?.id ?? branch.businessId) !== startedBusinessId ||
          (this.selectedBranch()?.id ?? null) !== startedBranchId ||
          startedEditorVersion !== this.branchEditorVersion
        ) {
          this.saving.set(false);
          return;
        }
        this.selectedBranch.set(branch);
        this.loadBranches(this.branchOnlyMode() ? undefined : branch.businessId, branch.id);
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: (error: unknown) => {
        if (
          requestVersion !== this.branchSaveVersion ||
          (this.selectedBusiness()?.id ?? startedBusinessId) !== startedBusinessId ||
          (this.selectedBranch()?.id ?? null) !== startedBranchId ||
          startedEditorVersion !== this.branchEditorVersion
        ) {
          this.saving.set(false);
          return;
        }
        if (this.isBranchArchiveConflictError(error)) {
          this.error.set('This branch cannot be archived while it has future confirmed appointments. Move or cancel those appointments first.');
          this.saving.set(false);
          return;
        }
        if (this.isBranchCurrencyLockedError(error)) {
          this.error.set('This branch currency is locked because finance history already exists. Keep the current currency for this branch.');
          this.saving.set(false);
          return;
        }
        if (this.isBranchBusinessInactiveError(error)) {
          this.error.set('This business is inactive. Reactivate the business before creating a branch or reactivating one.');
          this.saving.set(false);
          return;
        }

        this.error.set('Settings could not be saved.');
        this.saving.set(false);
      },
    });
  }

  protected saveHours(): void {
    const branch = this.selectedBranch();
    if (!branch) {
      this.error.set('Select a branch before saving hours.');
      return;
    }
    if (!this.branchSettingsLoaded()) {
      this.error.set('Branch settings are still loading.');
      return;
    }
    if (this.hoursForm.invalid) {
      this.hoursForm.markAllAsTouched();
      if (this.hoursForm.controls.timezone.errors?.['branchTimezone']) {
        this.error.set('Weekly hours must use the selected branch timezone.');
      }
      return;
    }
    if (this.hasInvalidIntervalRanges()) {
      this.hoursForm.markAllAsTouched();
      this.error.set('Fix weekly hours so each interval starts before it ends and open-day intervals do not overlap.');
      return;
    }
    if (this.hasOpenDayWithoutIntervals()) {
      this.error.set('Add at least one interval for each open day before saving hours.');
      return;
    }

    const startedBranchId = branch.id;
    const requestVersion = ++this.hoursSaveVersion;
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.replaceBranchHours(branch.id, this.buildWeeklyHoursInput()).subscribe({
      next: () => {
        if (requestVersion !== this.hoursSaveVersion || this.selectedBranch()?.id !== startedBranchId) {
          this.saving.set(false);
          return;
        }
        this.hoursConflictRequiresAcknowledgement.set(false);
        this.hoursForm.controls.acknowledgeExistingAppointmentsOutsideHours.setValue(false);
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: (error: unknown) => {
        if (requestVersion !== this.hoursSaveVersion || this.selectedBranch()?.id !== startedBranchId) {
          this.saving.set(false);
          return;
        }
        if (this.isHoursConflictError(error)) {
          this.hoursConflictRequiresAcknowledgement.set(true);
          this.error.set('Confirm the hours change before saving because future appointments fall outside the proposed schedule.');
          this.saving.set(false);
          return;
        }

        this.error.set('Settings could not be saved.');
        this.saving.set(false);
      },
    });
  }

  protected saveHoliday(): void {
    const branch = this.selectedBranch();
    if (!branch) {
      this.error.set('Select a branch before saving a holiday.');
      return;
    }
    if (!this.branchSettingsLoaded()) {
      this.error.set('Branch settings are still loading.');
      return;
    }
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      if (this.holidayForm.errors?.['intervalOrder']) {
        this.error.set('Holiday open hours must start before they end.');
      }
      return;
    }

    const value = this.holidayForm.getRawValue();
    const holidayInput = this.buildHolidayInput(value);
    if (!holidayInput) {
      return;
    }
    const startedBranchId = branch.id;
    const requestVersion = ++this.holidaySaveVersion;
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.setBranchHoliday(branch.id, value.date, holidayInput).subscribe({
      next: (savedHoliday) => {
        if (requestVersion !== this.holidaySaveVersion || this.selectedBranch()?.id !== startedBranchId) {
          this.saving.set(false);
          return;
        }
        this.selectedHoliday.set(savedHoliday);
        this.holidays.update((holidays) => this.upsertHoliday(holidays, savedHoliday));
        this.selectHoliday(savedHoliday);
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: () => {
        if (requestVersion !== this.holidaySaveVersion || this.selectedBranch()?.id !== startedBranchId) {
          this.saving.set(false);
          return;
        }
        this.error.set('Settings could not be saved.');
        this.saving.set(false);
      },
    });
  }

  protected savePolicy(): void {
    const branch = this.selectedBranch();
    if (!branch) {
      this.error.set('Select a branch before saving policy.');
      return;
    }
    if (!this.branchSettingsLoaded()) {
      this.error.set('Branch settings are still loading.');
      return;
    }
    if (this.policyForm.invalid) {
      this.policyForm.markAllAsTouched();
      return;
    }

    const startedBranchId = branch.id;
    const requestVersion = ++this.policySaveVersion;

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.updateBranchPolicy(branch.id, this.policyForm.getRawValue()).subscribe({
      next: () => {
        if (requestVersion !== this.policySaveVersion || this.selectedBranch()?.id !== startedBranchId) {
          this.saving.set(false);
          return;
        }
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: () => {
        if (requestVersion !== this.policySaveVersion || this.selectedBranch()?.id !== startedBranchId) {
          this.saving.set(false);
          return;
        }
        this.error.set('Settings could not be saved.');
        this.saving.set(false);
      },
    });
  }

  protected getDayIntervals(dayIndex: number): FormArray {
    return this.dayForms.at(dayIndex).get('intervals') as FormArray;
  }

  protected addInterval(dayIndex: number): void {
    this.getDayIntervals(dayIndex).push(this.createIntervalGroup());
  }

  protected removeInterval(dayIndex: number, intervalIndex: number): void {
    this.getDayIntervals(dayIndex).removeAt(intervalIndex);
  }

  protected onDayOpenToggle(dayIndex: number): void {
    const dayGroup = this.dayForms.at(dayIndex);
    if (dayGroup.get('open')?.value && this.getDayIntervals(dayIndex).length === 0) {
      this.addInterval(dayIndex);
    }
    this.syncDayIntervalsState(dayGroup);
  }

  protected selectHoliday(holiday: BranchHoliday): void {
    this.selectedHoliday.set(holiday);
    const firstInterval = holiday.intervals[0];
    this.holidayForm.reset({
      date: holiday.date,
      closed: holiday.closed,
      reason: holiday.reason ?? '',
      start: firstInterval?.start ?? '09:00',
      end: firstInterval?.end ?? '17:00',
    });
    this.updateHolidayTimeValidators(holiday.closed);
  }

  private createDayGroup(dayOfWeek: number, value?: WeeklyHoursDay) {
    const intervals = value?.intervals.length ? value.intervals : [{ start: '09:00', end: '17:00' }];
    const dayGroup = this.fb.nonNullable.group({
      dayOfWeek: [value?.dayOfWeek ?? dayOfWeek],
      open: [value?.open ?? dayOfWeek > 0],
      intervals: this.fb.nonNullable.array([
        ...intervals.map((interval) => this.createIntervalGroup(interval)),
      ], { validators: [intervalsValidator()] }),
    });
    this.syncDayIntervalsState(dayGroup);
    return dayGroup;
  }

  private createIntervalGroup(interval = { start: '09:00', end: '17:00' }) {
    return this.fb.nonNullable.group({
      start: [interval.start, [Validators.required, Validators.pattern(timePattern)]],
      end: [interval.end, [Validators.required, Validators.pattern(timePattern)]],
    });
  }

  private updateHolidayTimeValidators(closed: boolean): void {
    const validators = closed ? [] : [Validators.required, Validators.pattern(timePattern)];
    this.holidayForm.controls.start.setValidators(validators);
    this.holidayForm.controls.end.setValidators(validators);
    this.holidayForm.controls.start.updateValueAndValidity({ emitEvent: false });
    this.holidayForm.controls.end.updateValueAndValidity({ emitEvent: false });
  }

  private loadInitialState(): void {
    if (this.branchRouteMode) {
      this.loadBranches();
      return;
    }

    this.loadBusinesses();
  }

  private loadBusinesses(selectBusinessId?: string): void {
    const requestVersion = ++this.businessLoadVersion;
    const startedBusinessId = this.selectedBusiness()?.id ?? null;
    const startedEditorVersion = this.businessEditorVersion;
    this.loading.set(true);
    this.api.listBusinesses().subscribe({
      next: (result) => {
        if (
          requestVersion !== this.businessLoadVersion ||
          startedEditorVersion !== this.businessEditorVersion ||
          (this.selectedBusiness()?.id ?? null) !== startedBusinessId
        ) {
          this.loading.set(false);
          return;
        }
        this.businesses.set(result.items);
        const selected = result.items.find((business) => business.id === selectBusinessId) ?? result.items[0] ?? null;
        if (selected) {
          this.selectBusiness(selected);
        } else if (!this.branchOnlyMode()) {
          this.resetBranchEditor('');
        }
        this.loading.set(false);
      },
      error: () => {
        if (
          requestVersion !== this.businessLoadVersion ||
          startedEditorVersion !== this.businessEditorVersion ||
          (this.selectedBusiness()?.id ?? null) !== startedBusinessId
        ) {
          this.loading.set(false);
          return;
        }
        this.error.set('Business settings could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  private loadBranches(businessId?: string, selectBranchId?: string): void {
    const requestVersion = ++this.branchLoadVersion;
    this.api.listBranches(businessId).subscribe({
      next: (result) => {
        if (
          requestVersion !== this.branchLoadVersion ||
          (typeof businessId === 'string' && this.selectedBusiness()?.id !== businessId)
        ) {
          return;
        }
        this.branches.set(result.items);
        const selected = result.items.find((branch) => branch.id === selectBranchId) ?? result.items[0] ?? null;
        if (selected) {
          this.selectBranch(selected);
        } else {
          if (this.branchOnlyMode() && !this.isStaffUser() && typeof businessId === 'undefined') {
            this.loadBusinesses();
            return;
          }
          this.resetBranchEditor(this.selectedBusiness()?.id ?? '');
        }
      },
      error: (error: unknown) => {
        if (
          requestVersion !== this.branchLoadVersion ||
          (typeof businessId === 'string' && this.selectedBusiness()?.id !== businessId)
        ) {
          return;
        }
        this.branches.set([]);
        this.selectedBranch.set(null);
        this.resetBranchEditor(this.selectedBusiness()?.id ?? '');
        if (this.branchOnlyMode() && this.isStaffUser() && this.isForbiddenError(error)) {
          this.error.set('You need branch-manager access to manage branch settings for this business.');
          return;
        }
        this.error.set('Branches could not be loaded.');
      },
    });
  }

  private loadBranchSettings(branch: BranchProfile): void {
    const requestVersion = ++this.branchSettingsLoadVersion;
    forkJoin({
      hours: this.api.getBranchHours(branch.id),
      holidays: this.api.listBranchHolidays(branch.id),
      policy: this.api.getBranchPolicy(branch.id),
    }).subscribe({
      next: ({ hours, holidays, policy }) => {
        if (requestVersion !== this.branchSettingsLoadVersion || this.selectedBranch()?.id !== branch.id) {
          return;
        }
        this.applyBranchHours(hours);
        this.holidays.set(holidays);
        this.policyForm.reset({
          bookingLeadMinutes: policy.bookingLeadMinutes,
          cancellationCutoffMinutes: policy.cancellationCutoffMinutes,
          noShowGraceMinutes: policy.noShowGraceMinutes,
        });
        this.branchSettingsLoaded.set(true);
      },
      error: () => {
        if (requestVersion !== this.branchSettingsLoadVersion || this.selectedBranch()?.id !== branch.id) {
          return;
        }
        this.branchSettingsLoaded.set(false);
        this.error.set('Branch settings could not be loaded.');
      },
    });
  }

  private applyBranchHours(hours: BranchHours): void {
    this.hoursForm.controls.timezone.setValue(hours.timezone);
    this.hoursForm.controls.timezone.updateValueAndValidity({ emitEvent: false });
    this.hoursForm.controls.acknowledgeExistingAppointmentsOutsideHours.setValue(false);
    this.hoursConflictRequiresAcknowledgement.set(false);
    this.dayForms.clear();
    hours.days
      .slice()
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
      .forEach((day) => this.dayForms.push(this.createDayGroup(day.dayOfWeek, day)));
  }

  private defaultHours(timezone: string): BranchHours {
    return {
      branchId: '',
      timezone,
      days: weekdays.map((_, dayOfWeek) => ({
        dayOfWeek,
        open: dayOfWeek > 0,
        intervals: dayOfWeek > 0 ? [{ start: '09:00', end: '17:00' }] : [],
      })),
    };
  }

  private buildWeeklyHoursInput() {
    return {
      timezone: this.hoursForm.controls.timezone.value,
      acknowledgeExistingAppointmentsOutsideHours:
        this.hoursForm.controls.acknowledgeExistingAppointmentsOutsideHours.value,
      days: (this.hoursForm.controls.days.getRawValue() as WeeklyHoursDay[]).map((day) => ({
        ...day,
        intervals: day.open ? day.intervals : [],
      })),
    };
  }

  private hasOpenDayWithoutIntervals(): boolean {
    return (this.hoursForm.controls.days.getRawValue() as WeeklyHoursDay[]).some((day) => day.open && day.intervals.length === 0);
  }

  private hasInvalidIntervalRanges(): boolean {
    return this.dayForms.controls.some((dayGroup) => dayGroup.get('open')?.value && dayGroup.get('intervals')?.errors !== null);
  }

  private validateSelectedBranchTimezone(control: AbstractControl): ValidationErrors | null {
    const branchTimezone = this.selectedBranch()?.timezone;
    if (!branchTimezone) {
      return null;
    }
    return control.value === branchTimezone ? null : { branchTimezone: true };
  }

  private syncDayIntervalsState(dayGroup: AbstractControl): void {
    const intervals = dayGroup.get('intervals') as FormArray | null;
    const isOpen = dayGroup.get('open')?.value === true;

    if (!intervals) {
      return;
    }

    if (isOpen) {
      intervals.enable({ emitEvent: false });
    } else {
      intervals.disable({ emitEvent: false });
    }

    intervals.updateValueAndValidity({ emitEvent: false });
  }

  private resetBranchEditor(businessId: string): void {
    this.hoursSaveVersion += 1;
    this.holidaySaveVersion += 1;
    this.selectedBranch.set(null);
    this.selectedHoliday.set(null);
    this.branchSettingsLoaded.set(false);
    this.holidays.set([]);
    this.branchForm.reset({
      businessId,
      name: '',
      phone: '',
      email: '',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'JP',
      },
    });
    this.applyBranchHours(this.defaultHours('Asia/Tokyo'));
    this.holidayForm.reset({
      date: localDateInputValue(),
      closed: true,
      reason: '',
      start: '09:00',
      end: '17:00',
    });
    this.updateHolidayTimeValidators(this.holidayForm.controls.closed.value);
    this.policyForm.reset(defaultPolicy);
  }

  private isHoursConflictError(error: unknown): boolean {
    const responseError =
      error instanceof HttpErrorResponse
        ? error.error
        : typeof error === 'object' && error !== null && 'error' in error
          ? error.error
          : null;

    const errorCode =
      typeof responseError === 'object' &&
      responseError !== null &&
      'code' in responseError &&
      typeof responseError.code === 'string'
        ? responseError.code
        : null;
    const errorMessage =
      typeof responseError === 'object' &&
      responseError !== null &&
      'message' in responseError &&
      typeof responseError.message === 'string'
        ? responseError.message
        : typeof responseError === 'string'
          ? responseError
          : null;

    return (
      errorCode === 'error.branch.hours.appointments_outside_hours' ||
      errorMessage === 'error.branch.hours.appointments_outside_hours'
    );
  }

  private isBranchArchiveConflictError(error: unknown): boolean {
    const responseError =
      error instanceof HttpErrorResponse
        ? error.error
        : typeof error === 'object' && error !== null && 'error' in error
          ? error.error
          : null;

    const errorCode =
      typeof responseError === 'object' &&
      responseError !== null &&
      'code' in responseError &&
      typeof responseError.code === 'string'
        ? responseError.code
        : null;
    const errorMessage =
      typeof responseError === 'object' &&
      responseError !== null &&
      'message' in responseError &&
      typeof responseError.message === 'string'
        ? responseError.message
        : typeof responseError === 'string'
          ? responseError
          : null;

    return errorCode === 'error.branch.profile.status_conflict' || errorMessage === 'error.branch.profile.status_conflict';
  }

  private isBranchCurrencyLockedError(error: unknown): boolean {
    const responseError =
      error instanceof HttpErrorResponse
        ? error.error
        : typeof error === 'object' && error !== null && 'error' in error
          ? error.error
          : null;

    const errorCode =
      typeof responseError === 'object' &&
      responseError !== null &&
      'code' in responseError &&
      typeof responseError.code === 'string'
        ? responseError.code
        : null;
    const errorMessage =
      typeof responseError === 'object' &&
      responseError !== null &&
      'message' in responseError &&
      typeof responseError.message === 'string'
        ? responseError.message
        : typeof responseError === 'string'
          ? responseError
          : null;

    return errorCode === 'error.branch.profile.currency_locked' || errorMessage === 'error.branch.profile.currency_locked';
  }

  private isBranchBusinessInactiveError(error: unknown): boolean {
    const responseError =
      error instanceof HttpErrorResponse
        ? error.error
        : typeof error === 'object' && error !== null && 'error' in error
          ? error.error
          : null;

    const errorCode =
      typeof responseError === 'object' &&
      responseError !== null &&
      'code' in responseError &&
      typeof responseError.code === 'string'
        ? responseError.code
        : null;
    const errorMessage =
      typeof responseError === 'object' &&
      responseError !== null &&
      'message' in responseError &&
      typeof responseError.message === 'string'
        ? responseError.message
        : typeof responseError === 'string'
          ? responseError
          : null;

    return errorCode === 'error.branch.profile.business_inactive' || errorMessage === 'error.branch.profile.business_inactive';
  }

  private isBusinessDeactivationConflictError(error: unknown): boolean {
    const responseError =
      error instanceof HttpErrorResponse
        ? error.error
        : typeof error === 'object' && error !== null && 'error' in error
          ? error.error
          : null;

    const errorCode =
      typeof responseError === 'object' &&
      responseError !== null &&
      'code' in responseError &&
      typeof responseError.code === 'string'
        ? responseError.code
        : null;
    const errorMessage =
      typeof responseError === 'object' &&
      responseError !== null &&
      'message' in responseError &&
      typeof responseError.message === 'string'
        ? responseError.message
        : typeof responseError === 'string'
          ? responseError
          : null;

    return errorCode === 'error.business.profile.status_conflict' || errorMessage === 'error.business.profile.status_conflict';
  }

  private isForbiddenError(error?: unknown): boolean {
    const status =
      error instanceof HttpErrorResponse
        ? error.status
        : typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
          ? error.status
          : null;
    const responseError =
      error instanceof HttpErrorResponse
        ? error.error
        : typeof error === 'object' && error !== null && 'error' in error
          ? error.error
          : null;
    const errorCode =
      typeof responseError === 'object' &&
      responseError !== null &&
      'code' in responseError &&
      typeof responseError.code === 'string'
        ? responseError.code
        : null;
    const errorMessage =
      typeof responseError === 'object' &&
      responseError !== null &&
      'message' in responseError &&
      typeof responseError.message === 'string'
        ? responseError.message
        : typeof responseError === 'string'
          ? responseError
          : null;

    return status === 403 || errorCode === 'error.forbidden_scope' || errorMessage === 'error.forbidden_scope';
  }

  private resetHoursConflictAcknowledgement(): void {
    if (!this.hoursConflictRequiresAcknowledgement()) {
      return;
    }

    this.hoursConflictRequiresAcknowledgement.set(false);
    this.hoursForm.controls.acknowledgeExistingAppointmentsOutsideHours.setValue(false, { emitEvent: false });
  }

  private buildHolidayInput(value: { date: string; closed: boolean; reason: string; start: string; end: string }) {
    const selectedHoliday = this.selectedHoliday();
    const reason = optionalText(value.reason);

    if (value.closed) {
      return {
        closed: true,
        reason,
        intervals: [],
      };
    }

    if (selectedHoliday && !selectedHoliday.closed && selectedHoliday.intervals.length > 1) {
      const [firstInterval] = selectedHoliday.intervals;
      if (value.date !== selectedHoliday.date || value.start !== firstInterval?.start || value.end !== firstInterval?.end) {
        this.error.set('This holiday has multiple open intervals. Change only the reason here, or recreate the holiday to edit its hours.');
        return null;
      }

      return {
        closed: false,
        reason,
        intervals: selectedHoliday.intervals,
      };
    }

    return {
      closed: false,
      reason,
      intervals: [{ start: value.start, end: value.end }],
    };
  }

  private upsertHoliday(holidays: readonly BranchHoliday[], savedHoliday: BranchHoliday): readonly BranchHoliday[] {
    const next = holidays.filter((holiday) => holiday.date !== savedHoliday.date).concat(savedHoliday);
    return next.slice().sort((left, right) => left.date.localeCompare(right.date));
  }

}
