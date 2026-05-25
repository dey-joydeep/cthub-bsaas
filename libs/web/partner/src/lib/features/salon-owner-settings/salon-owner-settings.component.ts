import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable } from 'rxjs';

import { BranchProfile, SalonBusiness, WeeklyHoursDay } from './models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from './salon-owner-settings.api';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

@Component({
  selector: 'lib-salon-owner-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
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

  protected readonly weekdays = weekdays;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly businesses = signal<readonly SalonBusiness[]>([]);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly selectedBusiness = signal<SalonBusiness | null>(null);
  protected readonly selectedBranch = signal<BranchProfile | null>(null);
  protected readonly hasBusiness = computed(() => this.businesses().length > 0);
  protected readonly hasBranch = computed(() => this.branches().length > 0);

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
    timezone: ['Asia/Tokyo', Validators.required],
    currency: ['JPY', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
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
    timezone: ['Asia/Tokyo', Validators.required],
    days: this.fb.array(weekdays.map((_, dayOfWeek) => this.createDayGroup(dayOfWeek))),
  });

  protected readonly holidayForm = this.fb.nonNullable.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    closed: [true],
    reason: ['', Validators.maxLength(160)],
    start: ['09:00'],
    end: ['17:00'],
  });

  protected readonly policyForm = this.fb.nonNullable.group({
    bookingLeadMinutes: [30, [Validators.required, Validators.min(0)]],
    cancellationCutoffMinutes: [120, [Validators.required, Validators.min(0)]],
    noShowGraceMinutes: [10, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.loadBusinesses();
  }

  protected get dayForms(): FormArray {
    return this.hoursForm.controls.days;
  }

  protected selectBusiness(business: SalonBusiness): void {
    this.selectedBusiness.set(business);
    this.businessForm.reset({
      displayName: business.displayName,
      legalName: business.legalName,
      status: business.status,
    });
    this.branchForm.patchValue({ businessId: business.id });
    this.loadBranches(business.id);
  }

  protected selectBranch(branch: BranchProfile): void {
    this.selectedBranch.set(branch);
    this.branchForm.reset({
      businessId: branch.businessId,
      name: branch.name,
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      timezone: branch.timezone,
      currency: branch.currency,
      address: {
        line1: branch.address.line1,
        line2: branch.address.line2 ?? '',
        city: branch.address.city,
        state: branch.address.state,
        postalCode: branch.address.postalCode,
        country: branch.address.country,
      },
    });
    this.hoursForm.patchValue({ timezone: branch.timezone });
  }

  protected newBranch(): void {
    const businessId = this.selectedBusiness()?.id ?? '';
    this.selectedBranch.set(null);
    this.branchForm.reset({
      businessId,
      name: '',
      phone: '',
      email: '',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'JP',
      },
    });
    this.hoursForm.patchValue({ timezone: 'Asia/Tokyo' });
  }

  protected saveBusiness(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedBusiness();
    const request = selected
      ? this.api.updateBusiness(selected.id, this.businessForm.getRawValue())
      : this.api.createBusiness(this.businessForm.getRawValue());

    this.persist(request, (business) => {
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
    const request = selected
      ? this.api.updateBranch(selected.id, this.branchForm.getRawValue())
      : this.api.createBranch(this.branchForm.getRawValue());

    this.persist(request, (branch) => {
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

    this.persist(
      this.api.replaceBranchHours(branch.id, {
        timezone: this.hoursForm.controls.timezone.value,
        days: this.hoursForm.controls.days.getRawValue() as WeeklyHoursDay[],
      }),
    );
  }

  protected saveHoliday(): void {
    const branch = this.selectedBranch();
    if (!branch) {
      this.error.set('Select a branch before saving a holiday.');
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

    this.persist(this.api.updateBranchPolicy(branch.id, this.policyForm.getRawValue()));
  }

  private createDayGroup(dayOfWeek: number) {
    return this.fb.nonNullable.group({
      dayOfWeek: [dayOfWeek],
      open: [dayOfWeek > 0],
      intervals: this.fb.nonNullable.array([
        this.fb.nonNullable.group({
          start: ['09:00', Validators.required],
          end: ['17:00', Validators.required],
        }),
      ]),
    });
  }

  private loadBusinesses(selectBusinessId?: string): void {
    this.loading.set(true);
    this.api.listBusinesses().subscribe({
      next: (result) => {
        this.businesses.set(result.items);
        const selected = result.items.find((business) => business.id === selectBusinessId) ?? result.items[0] ?? null;
        if (selected) {
          this.selectBusiness(selected);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Business settings could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  private loadBranches(businessId: string, selectBranchId?: string): void {
    this.api.listBranches(businessId).subscribe({
      next: (result) => {
        this.branches.set(result.items);
        const selected = result.items.find((branch) => branch.id === selectBranchId) ?? result.items[0] ?? null;
        if (selected) {
          this.selectBranch(selected);
        } else {
          this.newBranch();
        }
      },
      error: () => this.error.set('Branches could not be loaded.'),
    });
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
