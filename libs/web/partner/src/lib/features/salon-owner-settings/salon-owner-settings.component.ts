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
import { forkJoin, Observable, of } from 'rxjs';

import { CURRENT_USER } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';

import { BranchHours, BranchPolicy, BranchProfile, SalonBusiness, WeeklyHoursDay } from './models/salon-owner-settings.models';
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
  private businessEditorVersion = 0;
  private branchLoadVersion = 0;
  private branchSettingsLoadVersion = 0;
  private businessSaveVersion = 0;
  private branchEditorVersion = 0;
  private branchSaveVersion = 0;
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
  protected readonly selectedBusiness = signal<SalonBusiness | null>(null);
  protected readonly selectedBranch = signal<BranchProfile | null>(null);
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
    timezone: ['Asia/Tokyo', [Validators.required, timezoneValidator()]],
    acknowledgeExistingAppointmentsOutsideHours: [false],
    days: this.fb.array(weekdays.map((_, dayOfWeek) => this.createDayGroup(dayOfWeek))),
  });

  protected readonly holidayForm = this.fb.nonNullable.group({
    date: [localDateInputValue(), Validators.required],
    closed: [true],
    reason: ['', Validators.maxLength(160)],
    start: ['09:00'],
    end: ['17:00'],
  });

  protected readonly policyForm = this.fb.nonNullable.group({
    bookingLeadMinutes: [defaultPolicy.bookingLeadMinutes, [Validators.required, nonNegativeIntValidator()]],
    cancellationCutoffMinutes: [defaultPolicy.cancellationCutoffMinutes, [Validators.required, nonNegativeIntValidator()]],
    noShowGraceMinutes: [defaultPolicy.noShowGraceMinutes, [Validators.required, nonNegativeIntValidator()]],
  });

  constructor() {
    this.holidayForm.controls.closed.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((closed) => {
      this.updateHolidayTimeValidators(closed);
    });
    this.updateHolidayTimeValidators(this.holidayForm.controls.closed.value);
    this.loadInitialState();
  }

  protected get dayForms(): FormArray {
    return this.hoursForm.controls.days;
  }

  protected selectBusiness(business: SalonBusiness): void {
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
    this.branchEditorVersion += 1;
    this.selectedBranch.set(branch);
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
    this.loadBranchSettings(branch);
  }

  protected newBusiness(): void {
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
    const businessId = this.selectedBusiness()?.id ?? '';
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

    this.persist(request, (business) => {
      if (
        (this.selectedBusiness()?.id ?? null) !== startedBusinessId ||
        requestVersion !== this.businessSaveVersion ||
        startedEditorVersion !== this.businessEditorVersion
      ) {
        return;
      }
      this.selectedBusiness.set(business);
      this.loadBusinesses(business.id);
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

    this.persist(request, (branch) => {
      if (
        requestVersion !== this.branchSaveVersion ||
        (this.selectedBusiness()?.id ?? branch.businessId) !== startedBusinessId ||
        (this.selectedBranch()?.id ?? null) !== startedBranchId ||
        startedEditorVersion !== this.branchEditorVersion
      ) {
        return;
      }
      this.selectedBranch.set(branch);
      this.loadBranches(branch.businessId, branch.id);
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

    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    this.api.replaceBranchHours(branch.id, this.buildWeeklyHoursInput()).subscribe({
      next: () => {
        this.hoursConflictRequiresAcknowledgement.set(false);
        this.hoursForm.controls.acknowledgeExistingAppointmentsOutsideHours.setValue(false);
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: (error: unknown) => {
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
      return;
    }

    const value = this.holidayForm.getRawValue();
    this.persist(
      this.api.setBranchHoliday(branch.id, value.date, {
        closed: value.closed,
        reason: value.reason || undefined,
        intervals: value.closed ? [] : [{ start: value.start, end: value.end }],
      }),
    );
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

    this.persist(this.api.updateBranchPolicy(branch.id, this.policyForm.getRawValue()));
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
  }

  private createDayGroup(dayOfWeek: number, value?: WeeklyHoursDay) {
    const intervals = value?.intervals.length ? value.intervals : [{ start: '09:00', end: '17:00' }];
    return this.fb.nonNullable.group({
      dayOfWeek: [value?.dayOfWeek ?? dayOfWeek],
      open: [value?.open ?? dayOfWeek > 0],
      intervals: this.fb.nonNullable.array([
        ...intervals.map((interval) => this.createIntervalGroup(interval)),
      ], { validators: [intervalsValidator()] }),
    });
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
    this.loading.set(true);
    this.api.listBusinesses().subscribe({
      next: (result) => {
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
      error: () => {
        if (
          requestVersion !== this.branchLoadVersion ||
          (typeof businessId === 'string' && this.selectedBusiness()?.id !== businessId)
        ) {
          return;
        }
        this.branches.set([]);
        this.selectedBranch.set(null);
        this.resetBranchEditor(this.selectedBusiness()?.id ?? '');
        this.error.set('Branches could not be loaded.');
      },
    });
  }

  private loadBranchSettings(branch: BranchProfile): void {
    const requestVersion = ++this.branchSettingsLoadVersion;
    forkJoin({
      hours: this.api.getBranchHours(branch.id),
      policy: this.api.getBranchPolicy(branch.id),
    }).subscribe({
      next: ({ hours, policy }) => {
        if (requestVersion !== this.branchSettingsLoadVersion || this.selectedBranch()?.id !== branch.id) {
          return;
        }
        this.applyBranchHours(hours);
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

  private resetBranchEditor(businessId: string): void {
    this.selectedBranch.set(null);
    this.branchSettingsLoaded.set(false);
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

  private persist<T>(request: Observable<T>, onSuccess?: (value: T) => void): void {
    this.saving.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess?.(value);
        this.message.set('Settings saved.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Settings could not be saved.');
        this.saving.set(false);
      },
    });
  }
}
