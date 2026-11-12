import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { phoneNumberValidator, scrollToFirstInvalidControl } from '@cthub-bsaas/web-core-common';
import { DateRangeComponent } from '@cthub-bsaas/web-ui';

import { BranchProfile } from '../salon-owner-settings/models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import {
  BusinessRole,
  PermissionItem,
  Service,
  ServiceCategory,
  Staff,
  StaffInput,
  StaffLeaveBlock,
  StaffRole,
} from './models/staff-service-catalog.models';
import { StaffServiceCatalogApi } from './staff-service-catalog.api';

const staffRoles: readonly StaffRole[] = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'STYLIST', 'CASHIER', 'INVENTORY_MANAGER'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const OWNER_PROTECTION_ERROR = $localize`:@@STAFF_CATALOG.ERROR_OWNER_PROTECTION:Cannot deactivate or remove the OWNER role from the last active owner of the business.`;

@Component({
  selector: 'lib-staff-service-catalog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    DateRangeComponent,
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
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('staffNgForm') private staffNgForm?: FormGroupDirective;
  private messageTimer?: ReturnType<typeof setTimeout>;

  protected readonly staffRoles = staffRoles;
  protected readonly weekdays = weekdays;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadingLeave = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly staff = signal<readonly Staff[]>([]);
  protected readonly roles = signal<readonly BusinessRole[]>([]);
  protected readonly permissions = signal<readonly PermissionItem[]>([]);
  protected readonly selectedRoleIds = signal<readonly string[]>([]);
  protected readonly selectedRolesSummary = computed(() => {
    const ids = this.selectedRoleIds();
    return this.roles().filter((r) => ids.includes(r.id));
  });
  protected readonly leaveBlocks = signal<readonly StaffLeaveBlock[]>([]);
  protected readonly categories = signal<readonly ServiceCategory[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly selectedStaff = signal<Staff | null>(null);
  protected readonly selectedService = signal<Service | null>(null);
  protected readonly staffSearchTerm = signal('');
  protected readonly staffBranchFilter = signal<string>('ALL');
  protected readonly selectedStaffSubTabIndex = signal(0);
  protected readonly filteredStaff = computed(() => {
    const term = this.staffSearchTerm().trim().toLowerCase();
    const branchFilter = this.staffBranchFilter();
    return this.staff().filter((member) => {
      const matchesBranch = branchFilter === 'ALL' || member.branchIds.includes(branchFilter);
      if (!matchesBranch) return false;
      if (!term) return true;
      const matchesName = member.displayName.toLowerCase().includes(term);
      const matchesEmail = member.email ? member.email.toLowerCase().includes(term) : false;
      const matchesPhone = member.phone.toLowerCase().includes(term);
      return matchesName || matchesEmail || matchesPhone;
    });
  });
  protected readonly hasBranches = computed(() => this.branches().length > 0);
  protected readonly hasStaff = computed(() => this.staff().length > 0);
  protected readonly hasServices = computed(() => this.services().length > 0);
  protected readonly selectedTabIndex = signal(this.initialTabIndex());
  protected readonly isServicesMode = computed(() => this.selectedTabIndex() === 1);
  protected readonly isStaffMode = computed(() => this.selectedTabIndex() === 0);
  protected readonly pageTitle = computed(() =>
    this.isServicesMode()
      ? $localize`:@@STAFF_CATALOG.TITLE_SERVICES:Service Catalog`
      : $localize`:@@STAFF_CATALOG.TITLE_STAFF:Staff Management`,
  );

  protected readonly staffForm = this.fb.nonNullable.group({
    branchIds: this.fb.nonNullable.control<string[]>([], Validators.required),
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.required, phoneNumberValidator(), Validators.maxLength(30)]],
    email: ['', Validators.email],
    status: this.fb.nonNullable.control<'ACTIVE' | 'INACTIVE'>('ACTIVE', Validators.required),
    addressPostalCode: ['', [Validators.pattern(/^\d{3}-?\d{4}$/)]],
    addressState: ['', [Validators.maxLength(60)]],
    addressCity: ['', [Validators.maxLength(60)]],
    addressLine1: ['', [Validators.maxLength(120)]],
    addressLine2: ['', [Validators.maxLength(120)]],
  });

  protected readonly roleForm = this.fb.nonNullable.group({
    roleIds: this.fb.nonNullable.control<string[]>([]),
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
    this.roleForm.controls.roleIds.valueChanges.subscribe((ids) => {
      this.selectedRoleIds.set(ids);
      const mappedRoles = this.roles()
        .filter((r) => ids.includes(r.id) && r.roleCode)
        .map((r) => r.roleCode as string);
      if (mappedRoles.length > 0) {
        this.roleForm.controls.roles.setValue(mappedRoles, { emitEvent: false });
      }
    });
    this.roleForm.controls.roles.valueChanges.subscribe((roles) => {
      const mappedIds = this.roles()
        .filter((r) => r.roleCode && roles.includes(r.roleCode))
        .map((r) => r.id);
      if (mappedIds.length > 0 && JSON.stringify(mappedIds) !== JSON.stringify(this.selectedRoleIds())) {
        this.selectedRoleIds.set(mappedIds);
        this.roleForm.controls.roleIds.setValue(mappedIds, { emitEvent: false });
      }
    });
    this.shiftForm.controls.branchId.valueChanges.subscribe((branchId) => {
      if (branchId) {
        const tz = this.branchTimezone(branchId);
        this.shiftForm.controls.timezone.setValue(tz, { emitEvent: false });
      }
    });
    this.loadCatalog();
  }

  protected selectStaff(member: Staff): void {
    this.message.set(null);
    this.error.set(null);
    this.selectedStaff.set(member);
    const staffFormValue = {
      branchIds: [...member.branchIds],
      displayName: member.displayName,
      phone: member.phone,
      email: member.email ?? '',
      status: member.status,
      addressPostalCode: member.address?.postalCode ?? '',
      addressState: member.address?.state ?? '',
      addressCity: member.address?.city ?? '',
      addressLine1: member.address?.line1 ?? '',
      addressLine2: member.address?.line2 ?? '',
    };
    if (this.staffNgForm) {
      this.staffNgForm.resetForm(staffFormValue);
    } else {
      this.staffForm.reset(staffFormValue);
    }
    let initialRoleIds: string[] = [];
    if (member.roleIds && member.roleIds.length > 0) {
      initialRoleIds = [...member.roleIds];
    } else if (member.roles && member.roles.length > 0) {
      initialRoleIds = this.roles()
        .filter((r) => r.roleCode && member.roles.includes(r.roleCode))
        .map((r) => r.id);
    }
    this.selectedRoleIds.set(initialRoleIds);
    this.roleForm.reset({
      roleIds: initialRoleIds,
      roles: [...member.roles],
    });
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
    this.message.set(null);
    this.error.set(null);
    this.selectedStaff.set(null);
    this.leaveBlocks.set([]);
    const firstBranch = this.branches()[0];
    const initialStaffValue = {
      branchIds: firstBranch ? [firstBranch.id] : [],
      displayName: '',
      phone: '',
      email: '',
      status: 'ACTIVE' as const,
      addressPostalCode: '',
      addressState: '',
      addressCity: '',
      addressLine1: '',
      addressLine2: '',
    };
    if (this.staffNgForm) {
      this.staffNgForm.resetForm(initialStaffValue);
    } else {
      this.staffForm.reset(initialStaffValue);
    }
    const defaultStylist = this.roles().find((r) => r.roleCode === 'STYLIST')?.id;
    const defaultRoleIds = defaultStylist ? [defaultStylist] : this.roles()[0] ? [this.roles()[0].id] : [];
    this.selectedRoleIds.set(defaultRoleIds);
    this.roleForm.reset({
      roleIds: defaultRoleIds,
      roles: ['STYLIST'],
    });
    this.skillForm.reset({ serviceIds: [] });
    this.shiftForm.patchValue({ branchId: firstBranch?.id ?? '', timezone: firstBranch?.timezone ?? 'Asia/Tokyo' });
    this.leaveForm.reset({
      branchId: firstBranch?.id ?? null,
      startsAt: '',
      endsAt: '',
      reason: '',
    });
    this.selectedStaffSubTabIndex.set(0);
  }

  protected cancelNewStaff(): void {
    this.message.set(null);
    this.error.set(null);
    const fallback = this.staff()[0];
    if (fallback) {
      this.selectStaff(fallback);
    }
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
      this.notifyError($localize`:@@STAFF_CATALOG.ERROR_FORM_INVALID:Please correct the highlighted fields before saving.`);
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
      $localize`:@@STAFF_CATALOG.MSG_STAFF_SAVED:Staff profile saved.`,
      $localize`:@@STAFF_CATALOG.ERROR_STAFF_SAVE:Staff profile could not be saved.`,
      OWNER_PROTECTION_ERROR,
    );
  }

  protected saveRoles(): void {
    const member = this.selectedStaff();
    if (!member) {
      this.error.set($localize`:@@STAFF_CATALOG.ERROR_SELECT_STAFF_ROLES:Select staff before saving roles.`);
      return;
    }
    const roleIds = this.roleForm.controls.roleIds.value;
    const selectedRoleObjects = this.roles().filter((r) => roleIds.includes(r.id));
    const roleCodes = selectedRoleObjects.map((r) => r.roleCode ?? r.name);
    const effectiveRoles = roleCodes.length > 0 ? roleCodes : this.roleForm.controls.roles.value;

    this.persist(
      this.catalogApi.replaceStaffRoles(member.id, {
        roleIds: roleIds.length > 0 ? roleIds : undefined,
        roles: effectiveRoles,
      }),
      (updated) => {
        this.selectedStaff.set(updated);
        this.staff.set(this.staff().map((m) => (m.id === updated.id ? updated : m)));
      },
      $localize`:@@STAFF_CATALOG.MSG_ROLES_SAVED:Staff roles saved.`,
      $localize`:@@STAFF_CATALOG.ERROR_ROLES_SAVE:Staff roles could not be saved.`,
      OWNER_PROTECTION_ERROR,
    );
  }

  protected saveSkills(): void {
    const member = this.selectedStaff();
    if (!member) {
      this.error.set($localize`:@@STAFF_CATALOG.ERROR_SELECT_STAFF_SKILLS:Select staff before saving skills.`);
      return;
    }
    this.persist(
      this.catalogApi.replaceStaffSkills(member.id, this.skillForm.getRawValue()),
      (updated) => this.selectedStaff.set(updated),
      $localize`:@@STAFF_CATALOG.MSG_SKILLS_SAVED:Staff skills saved.`,
      $localize`:@@STAFF_CATALOG.ERROR_SKILLS_SAVE:Staff skills could not be saved.`,
    );
  }

  protected saveShift(): void {
    const member = this.selectedStaff();
    if (!member) {
      this.message.set(null);
      this.error.set($localize`:@@STAFF_CATALOG.ERROR_SELECT_STAFF_SHIFT:Select staff before saving shift.`);
      return;
    }
    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      this.notifyError($localize`:@@STAFF_CATALOG.ERROR_SHIFT_INVALID:Please complete the required shift fields before saving.`);
      return;
    }
    const value = this.shiftForm.getRawValue();
    const effectiveTimezone = this.branchTimezone(value.branchId);
    this.persist(
      this.catalogApi.replaceStaffShifts(member.id, {
        branchId: value.branchId,
        timezone: effectiveTimezone,
        days: [{ dayOfWeek: value.dayOfWeek, intervals: [{ start: value.start, end: value.end }] }],
      }),
      undefined,
      $localize`:@@STAFF_CATALOG.MSG_SHIFT_SAVED:Weekly shift saved.`,
      $localize`:@@STAFF_CATALOG.ERROR_SHIFT_SAVE:Weekly shift could not be saved.`,
    );
  }

  protected saveLeave(): void {
    const member = this.selectedStaff();
    if (!member) {
      this.message.set(null);
      this.error.set($localize`:@@STAFF_CATALOG.ERROR_SELECT_STAFF_LEAVE:Select staff before scheduling leave.`);
      return;
    }
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      this.notifyError($localize`:@@STAFF_CATALOG.ERROR_LEAVE_INVALID:Please complete the required leave fields before scheduling.`);
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
      $localize`:@@STAFF_CATALOG.MSG_LEAVE_SAVED:Leave block scheduled.`,
      $localize`:@@STAFF_CATALOG.ERROR_LEAVE_SAVE:Leave block could not be scheduled.`,
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
      $localize`:@@STAFF_CATALOG.ERROR_LEAVE_REMOVE:Leave block could not be removed.`,
    );
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.notifyError($localize`:@@STAFF_CATALOG.ERROR_CATEGORY_INVALID:Please enter a valid category name and sort order.`);
      return;
    }
    this.persist(
      this.catalogApi.createServiceCategory(this.categoryForm.getRawValue()),
      () => this.loadCatalog(),
      $localize`:@@STAFF_CATALOG.MSG_CATEGORY_CREATED:Service category created.`,
      $localize`:@@STAFF_CATALOG.ERROR_CATEGORY_CREATE:Service category could not be created.`,
    );
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
      this.notifyError($localize`:@@STAFF_CATALOG.ERROR_FORM_INVALID:Please correct the highlighted fields before saving.`);
      return;
    }

    const selected = this.selectedService();
    const input = this.serviceForm.getRawValue();
    const request = selected ? this.catalogApi.updateService(selected.id, input) : this.catalogApi.createService(input);
    this.persist(
      request,
      (service) => {
        this.selectedService.set(service);
        this.loadCatalog(undefined, service.id);
      },
      $localize`:@@STAFF_CATALOG.MSG_SERVICE_SAVED:Service saved.`,
      $localize`:@@STAFF_CATALOG.ERROR_SERVICE_SAVE:Service could not be saved.`,
    );
  }

  protected saveEligibility(): void {
    const service = this.selectedService();
    if (!service) {
      this.error.set($localize`:@@STAFF_CATALOG.ERROR_SELECT_SERVICE_ELIGIBILITY:Select a service before saving eligibility.`);
      return;
    }
    this.persist(
      this.catalogApi.replaceServiceStaffEligibility(service.id, this.eligibilityForm.getRawValue()),
      (updated) => this.selectedService.set(updated),
      $localize`:@@STAFF_CATALOG.MSG_ELIGIBILITY_SAVED:Staff eligibility saved.`,
      $localize`:@@STAFF_CATALOG.ERROR_ELIGIBILITY_SAVE:Staff eligibility could not be saved.`,
    );
  }

  protected setServiceStatus(status: 'ACTIVE' | 'INACTIVE'): void {
    const service = this.selectedService();
    if (!service) {
      this.error.set('Select a service before changing status.');
      return;
    }
    this.persist(
      this.catalogApi.updateServiceStatus(service.id, { status }),
      (updated) => {
        this.selectedService.set(updated);
        this.serviceForm.patchValue({ status: updated.status });
      },
      'Service status updated.',
      'Service status could not be updated.',
    );
  }

  protected onStaffSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.staffSearchTerm.set(target.value);
    this.syncSelectionWithFilteredStaff();
  }

  protected clearStaffSearch(): void {
    this.staffSearchTerm.set('');
    this.syncSelectionWithFilteredStaff();
  }

  protected onStaffBranchFilterChange(branchId: string): void {
    this.staffBranchFilter.set(branchId);
    this.syncSelectionWithFilteredStaff();
  }

  private syncSelectionWithFilteredStaff(): void {
    const current = this.selectedStaff();
    if (!current) {
      return;
    }
    const visibleStaff = this.filteredStaff();
    if (!visibleStaff.some((m) => m.id === current.id)) {
      if (visibleStaff.length > 0) {
        this.selectStaff(visibleStaff[0]);
      } else {
        this.selectedStaff.set(null);
      }
    }
  }

  protected getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  protected staffBranchNames(member: Staff): string {
    if (!member.branchIds || member.branchIds.length === 0) return 'No branch assigned';
    return member.branchIds.map((id) => this.branchName(id)).join(', ');
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

  protected getPermissionName(code: string): string {
    return this.permissions().find((p) => p.code === code)?.name ?? code;
  }

  protected getPermissionDescription(code: string): string {
    return this.permissions().find((p) => p.code === code)?.description ?? '';
  }

  protected memberStaffRoles(member: Staff): readonly string[] {
    if (member.roleIds && member.roleIds.length > 0) {
      const names = this.roles()
        .filter((r) => member.roleIds?.includes(r.id))
        .map((r) => r.name);
      if (names.length > 0) return names;
    }
    return member.roles;
  }

  private normalizeStaffInput(): StaffInput {
    const value = this.staffForm.getRawValue();
    const postalCode = value.addressPostalCode.trim() || undefined;
    const state = value.addressState.trim() || undefined;
    const city = value.addressCity.trim() || undefined;
    const line1 = value.addressLine1.trim() || undefined;
    const line2 = value.addressLine2.trim() || undefined;
    const hasAddress = Boolean(postalCode || state || city || line1 || line2);

    return {
      branchIds: value.branchIds,
      displayName: value.displayName.trim(),
      phone: value.phone.trim(),
      email: value.email.trim() || undefined,
      status: value.status,
      address: hasAddress
        ? {
            postalCode,
            state,
            city,
            line1,
            line2,
            country: 'JP',
          }
        : undefined,
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
      roles: this.catalogApi.listRoles(),
      permissions: this.catalogApi.listPermissions(),
      categories: this.catalogApi.listServiceCategories(),
      services: this.catalogApi.listServices(),
    }).subscribe({
      next: ({ branches, staff, roles, permissions, categories, services }) => {
        this.branches.set(branches.items);
        this.staff.set(staff.items);
        this.roles.set(roles.items);
        this.permissions.set(permissions);
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

  private notifyError(errorMessage: string): void {
    this.message.set(null);
    this.error.set(errorMessage);
    this.snackBar.open(errorMessage, 'Close', {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['salon-snack-error'],
    });
    scrollToFirstInvalidControl();
  }

  private persist<T>(
    request: Observable<T>,
    onSuccess?: (value: T) => void,
    successMessage: string | null = 'Changes saved.',
    errorMessage = 'Changes could not be saved.',
    conflictMessage?: string,
  ): void {
    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess?.(value);
        if (this.messageTimer) {
          clearTimeout(this.messageTimer);
        }
        this.message.set(successMessage);
        if (successMessage) {
          this.messageTimer = setTimeout(() => {
            this.message.set(null);
          }, 4000);
          this.snackBar.open(successMessage, 'Close', {
            duration: 3500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
        this.saving.set(false);
      },
      error: (err: unknown) => {
        let errorMsg = errorMessage;
        if ((err as { status?: number })?.status === 409) {
          errorMsg = conflictMessage ?? (err as { error?: { message?: string } })?.error?.message ?? OWNER_PROTECTION_ERROR;
        }
        this.error.set(errorMsg);
        this.snackBar.open(errorMsg, 'Close', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['salon-snack-error'],
        });
        this.saving.set(false);
      },
    });
  }
}
