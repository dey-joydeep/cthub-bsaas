import type { PagedEnvelope, SalonBusinessStatus, TimeInterval } from '../../salon-owner-settings/models/salon-owner-settings.models';

export type StaffRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STYLIST' | 'CASHIER' | 'INVENTORY_MANAGER';
export type StaffStatus = SalonBusinessStatus;
export type ServiceStatus = SalonBusinessStatus;

export interface StaffInput {
  readonly branchIds: readonly string[];
  readonly displayName: string;
  readonly phone: string;
  readonly email?: string;
  readonly status: StaffStatus;
}

export interface Staff extends StaffInput {
  readonly id: string;
  readonly roles: readonly string[];
  readonly skillServiceIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StaffRolesInput {
  readonly roles: readonly string[];
}

export interface StaffSkillsInput {
  readonly serviceIds: readonly string[];
}

export interface StaffShiftDay {
  readonly dayOfWeek: number;
  readonly intervals: readonly TimeInterval[];
}

export interface StaffShiftInput {
  readonly branchId: string;
  readonly timezone: string;
  readonly days: readonly StaffShiftDay[];
}

export interface StaffLeaveBlockInput {
  readonly branchId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly reason: string;
}

export interface ServiceCategoryInput {
  readonly name: string;
  readonly sortOrder: number;
}

export interface ServiceCategory extends ServiceCategoryInput {
  readonly id: string;
}

export interface ServiceInput {
  readonly categoryId: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly bufferMinutes?: number;
  readonly basePrice: string;
  readonly taxRatePercent: string;
  readonly status: ServiceStatus;
}

export interface Service extends ServiceInput {
  readonly id: string;
  readonly bufferMinutes: number;
  readonly eligibleStaffIds: readonly string[];
}

export interface ServiceStatusInput {
  readonly status: ServiceStatus;
}

export interface StaffEligibilityInput {
  readonly staffIds: readonly string[];
}

export type StaffPage = PagedEnvelope<Staff>;
export type ServiceCategoryPage = PagedEnvelope<ServiceCategory>;
export type ServicePage = PagedEnvelope<Service>;
