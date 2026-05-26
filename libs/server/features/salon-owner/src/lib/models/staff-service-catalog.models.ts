import type { SalonOwnerStatus, TimeIntervalModel } from './salon-owner-settings.models';

export type StaffRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STYLIST' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface StaffModel {
  readonly id: string;
  readonly branchIds: readonly string[];
  readonly displayName: string;
  readonly phone: string;
  readonly email?: string;
  readonly status: SalonOwnerStatus;
  readonly roles: readonly string[];
  readonly skillServiceIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StaffShiftDayModel {
  readonly dayOfWeek: number;
  readonly intervals: readonly TimeIntervalModel[];
}

export interface StaffShiftModel {
  readonly staffId: string;
  readonly branchId: string;
  readonly timezone: string;
  readonly days: readonly StaffShiftDayModel[];
}

export interface StaffLeaveBlockModel {
  readonly id: string;
  readonly staffId: string;
  readonly branchId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly reason: string;
}

export interface ServiceCategoryModel {
  readonly id: string;
  readonly name: string;
  readonly sortOrder: number;
}

export interface ServiceModel {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly bufferMinutes: number;
  readonly basePrice: string;
  readonly taxRatePercent: string;
  readonly status: SalonOwnerStatus;
  readonly eligibleStaffIds: readonly string[];
}
