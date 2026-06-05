import type { AuthenticatedUser } from '@cthub-bsaas/shared';

export type SalonOwnerStatus = 'ACTIVE' | 'INACTIVE';

export interface SalonOwnerAddress {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface SalonBusinessModel {
  readonly id: string;
  readonly tenantId: string;
  readonly displayName: string;
  readonly legalName: string;
  readonly status: SalonOwnerStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BranchProfileModel {
  readonly id: string;
  readonly businessId: string;
  readonly name: string;
  readonly phone?: string;
  readonly email?: string;
  readonly timezone: string;
  readonly currency: string;
  readonly status: SalonOwnerStatus;
  readonly address: SalonOwnerAddress;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TimeIntervalModel {
  readonly start: string;
  readonly end: string;
}

export interface WeeklyHoursDayModel {
  readonly dayOfWeek: number;
  readonly open: boolean;
  readonly intervals: readonly TimeIntervalModel[];
}

export interface BranchHoursModel {
  readonly branchId: string;
  readonly timezone: string;
  readonly days: readonly WeeklyHoursDayModel[];
}

export interface BranchHolidayModel {
  readonly branchId: string;
  readonly date: string;
  readonly closed: boolean;
  readonly reason?: string;
  readonly intervals: readonly TimeIntervalModel[];
}

export interface BranchPolicyModel {
  readonly branchId: string;
  readonly bookingLeadMinutes: number;
  readonly cancellationCutoffMinutes: number;
  readonly noShowGraceMinutes: number;
}

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly page: {
    readonly limit: number;
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  };
}

export interface SalonOwnerRequestContext {
  readonly user: AuthenticatedUser;
}
