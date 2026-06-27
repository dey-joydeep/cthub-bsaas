export type SalonBusinessStatus = 'ACTIVE' | 'INACTIVE';
export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export interface ResponseEnvelopeMeta {
  readonly correlationId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
}

export interface ResponseEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: ResponseEnvelopeMeta;
}

export interface PagedEnvelope<T> {
  readonly items: readonly T[];
  readonly page: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface SalonOwnerAddress {
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface SalonBusinessInput {
  readonly displayName: string;
  readonly legalName: string;
  readonly status: SalonBusinessStatus;
}

export interface SalonBusiness extends SalonBusinessInput {
  readonly id: string;
  readonly tenantId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BranchProfileInput {
  readonly businessId: string;
  readonly name: string;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly timezone: string;
  readonly currency: string;
  readonly status: BranchStatus;
  readonly address: SalonOwnerAddress;
}

export interface BranchProfile extends BranchProfileInput {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TimeInterval {
  readonly start: string;
  readonly end: string;
}

export interface WeeklyHoursDay {
  readonly dayOfWeek: number;
  readonly open: boolean;
  readonly intervals: readonly TimeInterval[];
}

export interface WeeklyHoursInput {
  readonly timezone: string;
  readonly days: readonly WeeklyHoursDay[];
  readonly acknowledgeExistingAppointmentsOutsideHours?: boolean;
}

export interface BranchHours extends WeeklyHoursInput {
  readonly branchId: string;
}

export interface BranchHoliday {
  readonly branchId: string;
  readonly date: string;
  readonly closed: boolean;
  readonly reason?: string;
  readonly intervals: readonly TimeInterval[];
}

export interface BranchHolidayList {
  readonly items: readonly BranchHoliday[];
}

export interface BranchHolidayInput {
  readonly closed: boolean;
  readonly reason?: string;
  readonly intervals?: readonly TimeInterval[];
}

export interface BranchPolicyInput {
  readonly bookingLeadMinutes: number;
  readonly cancellationCutoffMinutes: number;
  readonly noShowGraceMinutes: number;
}

export interface BranchPolicy extends BranchPolicyInput {
  readonly branchId: string;
}
