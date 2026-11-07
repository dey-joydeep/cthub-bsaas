import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { BranchProfile } from '../salon-owner-settings/models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { Service, ServiceCategory, Staff, StaffInput, StaffLeaveBlock, StaffRole } from './models/staff-service-catalog.models';
import { StaffServiceCatalogApi } from './staff-service-catalog.api';

const staffRoles: readonly StaffRole[] = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'STYLIST', 'CASHIER', 'INVENTORY_MANAGER'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const OWNER_PROTECTION_ERROR = 'Cannot deactivate or remove the OWNER role from the last active owner of the business.';

@Component({
  selector: 'lib-staff-service-catalog',
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
    MatTabsModule,
  ],
  templateUrl: './staff-service-catalog.component.html',
  styleUrls: ['./staff-service-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffServiceCatalogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsApi = inject(SalonOwnerSettingsApi);
  private readonly catalogApi = inject(StaffServiceCatalogApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly staffRoles = staffRoles;
  protected readonly weekdays = weekdays;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadingLeave = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly staff = signal<readonly Staff[]>([]);
  protected readonly leaveBlocks = signal<readonly StaffLeaveBlock[]>([]);
  protected readonly categories = signal<readonly ServiceCategory[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly selectedStaff = signal<Staff | null>(null);
  protected readonly selectedService = signal<Service | null>(null);
  protected readonly hasBranches = computed(() => this.branches().length > 0);
  protected readonly hasStaff = computed(() => this.staff().length > 0);
  protected readonly hasServices = computed(() => this.services().length > 0);
  protected readonly selectedTabIndex = signal(this.initialTabIndex());

  protected readonly staffForm = this.fb.nonNullable.group({
    branchIds: this.fb.nonNullable.control<string[]>([], Validators.required),
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', Validators.email],
    status: this.fb.nonNullable.control<'ACTIVE' | 'INACTIVE'>('ACTIVE', Validators.required),
  });

  protected readonly roleForm = this.fb.nonNullable.group({
    roles: this.fb.nonNullable.control<string[]>(['STYLIST'], Validators.required),
  });

  protected readonly skillForm = this.fb.nonNullable.group({
    serviceIds: this.fb.nonNullable.control<string[]>([]),
  });

  protected readonly shiftForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    timezone: ['Asia/Tokyo', Validators.required],
    dayOfWeek: [1, [Validators.required, Validators.min(0), Validators.max(6)]],
    start: ['09:00', Validators.required],
    end: ['17:00', Validators.required],
  });

  protected readonly leaveForm = this.fb.group({
    branchId: this.fb.control<string | null>(null),
    startsAt: this.fb.nonNullable.control('', Validators.required),
    endsAt: this.fb.nonNullable.control('', Validators.required),
    reason: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
  });

  protected readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly serviceForm = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    durationMinutes: [45, [Validators.required, Validators.min(5), Validators.max(720)]],
    bufferMinutes: [0, [Validators.required, Validators.min(0)]],
    basePrice: ['0.00', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    taxRatePercent: ['0.00', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    status: this.fb.nonNullable.control<'ACTIVE' | 'INACTIVE'>('ACTIVE', Validators.required),
  });

  protected readonly eligibilityForm = this.fb.nonNullable.group({
    staffIds: this.fb.nonNullable.control<string[]>([]),
  });

  constructor() {
    this.loadCatalog();
  }

  protected selectStaff(member: Staff): void {
    this.selectedStaff.set(member);
    this.staffForm.reset({
      branchIds: [...member.branchIds],
      displayName: member.displayName,
      phone: member.phone,
      email: member.email ?? '',
      status: member.status,
    });
    this.roleForm.reset({ roles: [...member.roles] });
    this.skillForm.reset({ serviceIds: [...member.skillServiceIds] });
    this.shiftForm.patchValue({ branchId: member.branchIds[0] ?? '', timezone: this.branchTimezone(member.branchIds[0]) });
    this.leaveForm.reset({
      branchId: member.branchIds[0] ?? null,
      startsAt: '',
      endsAt: '',
      reason: '',
    });
    this.loadLeaveBlocks(member.id);
  }

  protected newStaff(): void {
    this.selectedStaff.set(null);
    this.leaveBlocks.set([]);
    const firstBranch = this.branches()[0];
    this.staffForm.reset({
      branchIds: firstBranch ? [firstBranch.id] : [],
      displayName: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
    });
    this.roleForm.reset({ roles: ['STYLIST'] });
    this.skillForm.reset({ serviceIds: [] });
    this.shiftForm.patchValue({ branchId: firstBranch?.id ?? '', timezone: firstBranch?.timezone ?? 'Asia/Tokyo' });
    this.leaveForm.reset({
      branchId: firstBranch?.id ?? null,
      startsAt: '',
      endsAt: '',
      reason: '',
    });
  }

  protected loadLeaveBlocks(staffId: string): void {
    this.loadingLeave.set(true);
    this.catalogApi.listStaffLeaveBlocks(staffId).subscribe({
      next: (page) => {
        if (this.selectedStaff()?.id === staffId) {
          this.leaveBlocks.set(page.items);
        }
        this.loadingLeave.set(false);
      },
      error: () => {
        this.loadingLeave.set(false);
      },
    });
  }

  protected saveStaff(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedStaff();
    const input = this.normalizeStaffInput();
    const request = selected ? this.catalogApi.updateStaff(selected.id, input) : this.catalogApi.createStaff(input);

    this.persist(
      request,
      (member) => {
        this.selectedStaff.set(member);
        this.loadCatalog(member.id);
      },
      'Catalog saved.',
      OWNER_PROTECTION_ERROR,
    );
  }

  protected saveRoles(): void {
    const member = this.selectedStaff();
    if (!member) {
      this.error.set('Select staff before saving roles.');
      return;
    }
    this.persist(
      this.catalogApi.replaceStaffRoles(member.id, this.roleForm.getRawValue()),
      (updated) => this.selectedStaff.set(updated),
      'Catalog saved.',
      OWNER_PROTECTION_ERROR,
    );
  }

  protected saveSkills(): void {
    const member = this.selectedStaff();
    if (!member) {
      this.error.set('Select staff before saving skills.');
      return;
    }
    this.persist(this.catalogApi.replaceStaffSkills(member.id, this.skillForm.getRawValue()), (updated) => this.selectedStaff.set(updated));
  }

  protected saveShift(): void {
    const member = this.selectedStaff();
    if (!member || this.shiftForm.invalid) {
      this.error.set('Select staff and complete the shift form.');
      return;
    }
    const value = this.shiftForm.getRawValue();
    this.persist(
      this.catalogApi.replaceStaffShifts(member.id, {
        branchId: value.branchId,
        timezone: value.timezone,
        days: [{ dayOfWeek: value.dayOfWeek, intervals: [{ start: value.start, end: value.end }] }],
      }),
    );
  }

  protected saveLeave(): void {
    const member = this.selectedStaff();
    if (!member || this.leaveForm.invalid) {
      this.error.set('Select staff and complete the leave form.');
      return;
    }
    const value = this.leaveForm.getRawValue();
    const branchId = value.branchId ? value.branchId : null;
    this.persist(
      this.catalogApi.createStaffLeaveBlock(member.id, {
        branchId,
        startsAt: this.localDateTimeToUtcIso(value.startsAt),
        endsAt: this.localDateTimeToUtcIso(value.endsAt),
        reason: value.reason,
      }),
      () => {
        this.leaveForm.patchValue({ startsAt: '', endsAt: '', reason: '' });
        this.loadLeaveBlocks(member.id);
      },
    );
  }

  protected deleteLeave(leaveBlockId: string): void {
    const member = this.selectedStaff();
    if (!member) {
      return;
    }
    this.persist(
      this.catalogApi.deleteStaffLeaveBlock(member.id, leaveBlockId),
      () => {
        this.loadLeaveBlocks(member.id);
      },
      null,
    );
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.persist(this.catalogApi.createServiceCategory(this.categoryForm.getRawValue()), () => this.loadCatalog());
  }

  protected selectService(service: Service): void {
    this.selectedService.set(service);
    this.serviceForm.reset({
      categoryId: service.categoryId,
      name: service.name,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      basePrice: service.basePrice,
      taxRatePercent: service.taxRatePercent,
      status: service.status,
    });
    this.eligibilityForm.reset({ staffIds: [...service.eligibleStaffIds] });
  }

  protected newService(): void {
    this.selectedService.set(null);
    this.serviceForm.reset({
      categoryId: this.categories()[0]?.id ?? '',
      name: '',
      durationMinutes: 45,
      bufferMinutes: 0,
      basePrice: '0.00',
      taxRatePercent: '0.00',
      status: 'ACTIVE',
    });
    this.eligibilityForm.reset({ staffIds: [] });
  }

  protected saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedService();
    const input = this.serviceForm.getRawValue();
    const request = selected ? this.catalogApi.updateService(selected.id, input) : this.catalogApi.createService(input);
    this.persist(request, (service) => {
      this.selectedService.set(service);
      this.loadCatalog(undefined, service.id);
    });
  }

  protected saveEligibility(): void {
    const service = this.selectedService();
    if (!service) {
      this.error.set('Select a service before saving eligibility.');
      return;
    }
    this.persist(this.catalogApi.replaceServiceStaffEligibility(service.id, this.eligibilityForm.getRawValue()), (updated) =>
      this.selectedService.set(updated),
    );
  }

  protected setServiceStatus(status: 'ACTIVE' | 'INACTIVE'): void {
    const service = this.selectedService();
    if (!service) {
      this.error.set('Select a service before changing status.');
      return;
    }
    this.persist(this.catalogApi.updateServiceStatus(service.id, { status }), (updated) => {
      this.selectedService.set(updated);
      this.serviceForm.patchValue({ status: updated.status });
    });
  }

  protected branchName(branchId: string): string {
    return this.branches().find((branch) => branch.id === branchId)?.name ?? branchId;
  }

  protected leaveBranchScope(branchId: string | null): string {
    return branchId ? this.branchName(branchId) : 'All Branches';
  }

  protected formatLeaveRange(startsAt: string, endsAt: string): string {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }

  protected categoryName(categoryId: string): string {
    return this.categories().find((category) => category.id === categoryId)?.name ?? categoryId;
  }

  private normalizeStaffInput(): StaffInput {
    const value = this.staffForm.getRawValue();
    return {
      branchIds: value.branchIds,
      displayName: value.displayName,
      phone: value.phone,
      email: value.email || undefined,
      status: value.status,
    };
  }

  private branchTimezone(branchId?: string): string {
    return this.branches().find((branch) => branch.id === branchId)?.timezone ?? 'Asia/Tokyo';
  }

  private initialTabIndex(): number {
    const tab = this.route.snapshot.data['catalogTab'] ?? this.route.parent?.snapshot.data['catalogTab'];
    return tab === 'services' ? 1 : 0;
  }

  private localDateTimeToUtcIso(value: string): string {
    return new Date(value).toISOString();
  }

  private loadCatalog(selectStaffId?: string, selectServiceId?: string): void {
    this.loading.set(true);
    forkJoin({
      branches: this.settingsApi.listBranches(),
      staff: this.catalogApi.listStaff(),
      categories: this.catalogApi.listServiceCategories(),
      services: this.catalogApi.listServices(),
    }).subscribe({
      next: ({ branches, staff, categories, services }) => {
        this.branches.set(branches.items);
        this.staff.set(staff.items);
        this.categories.set(categories.items);
        this.services.set(services.items);
        const selectedStaff = staff.items.find((member) => member.id === selectStaffId) ?? staff.items[0] ?? null;
        const selectedService = services.items.find((service) => service.id === selectServiceId) ?? services.items[0] ?? null;
        if (selectedStaff) {
          this.selectStaff(selectedStaff);
        } else {
          this.newStaff();
        }
        if (selectedService) {
          this.selectService(selectedService);
        } else {
          this.newService();
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Staff and service catalog could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  private persist<T>(
    request: Observable<T>,
    onSuccess?: (value: T) => void,
    successMessage: string | null = 'Catalog saved.',
    conflictMessage?: string,
  ): void {
    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess?.(value);
        this.message.set(successMessage);
        this.saving.set(false);
      },
      error: (err: unknown) => {
        if ((err as { status?: number })?.status === 409) {
          this.error.set(conflictMessage ?? (err as { error?: { message?: string } })?.error?.message ?? OWNER_PROTECTION_ERROR);
        } else {
          this.error.set('Catalog could not be saved.');
        }
        this.saving.set(false);
      },
    });
  }
}
