import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, SalonOwnerStatus as PrismaSalonOwnerStatus } from '@prisma/client';
import { AppointmentStatus, COMMON_MESSAGE_KEYS, UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { CorrelationId } from '@cthub-bsaas/server-core';
import { createHash, randomUUID } from 'crypto';

import { BranchHolidayInputDto, BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from '../dto/branch-settings.dto';
import { SalonBusinessInputDto } from '../dto/salon-business.dto';
import {
  BranchListFilters,
  BranchHolidayListModel,
  BranchHolidayModel,
  BranchHoursModel,
  BranchPolicyModel,
  BranchProfileModel,
  PagedResult,
  SalonBusinessModel,
  SalonOwnerPagination,
  SalonOwnerAddress,
  SalonOwnerRequestContext,
  SalonOwnerSupportContext,
  TimeIntervalModel,
  WeeklyHoursDayModel,
} from '../models/salon-owner-settings.models';

const duplicateBusinessMessage = 'error.business.profile.duplicate';
const duplicateBranchMessage = 'error.branch.profile.name.duplicate';
const businessStatusConflictMessage = 'error.business.profile.status_conflict';
const inactiveBusinessMessage = 'error.branch.profile.business_inactive';
const branchArchiveBlockedMessage = 'error.branch.profile.status_conflict';
const branchCurrencyLockedMessage = 'error.branch.profile.currency_locked';
const branchHoursConflictMessage = 'error.branch.hours.appointments_outside_hours';
const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const conflictMessage = COMMON_MESSAGE_KEYS.ERROR.CONFLICT;
const translatedUniqueConstraintMessage = 'A unique constraint was violated';
const confirmedAppointmentStatuses = [AppointmentStatus.CONFIRMED.toLowerCase(), AppointmentStatus.CONFIRMED] as const;
const schedulableAppointmentStatuses = [
  AppointmentStatus.PENDING.toLowerCase(),
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED.toLowerCase(),
  AppointmentStatus.CONFIRMED,
] as const;
const branchManagerPositions = new Set(['branch manager', 'manager']);
const weekdayByShortName: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const supportedCurrencyCodes = new Set(
  ((Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('currency') ?? []).map((code) =>
    code.toUpperCase(),
  ),
);

type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type BusinessRecord = Awaited<ReturnType<PrismaService['salonBusiness']['findFirstOrThrow']>>;
type HoursRecord = Awaited<ReturnType<PrismaService['salonBranchHours']['findMany']>>[number];
type PolicyRecord = Awaited<ReturnType<PrismaService['salonBranchPolicy']['upsert']>>;
type HolidayRecord = Awaited<ReturnType<PrismaService['salonBranchHoliday']['upsert']>>;
type TransactionClient = Prisma.TransactionClient;
type BranchMutationData = Prisma.SalonBranchUncheckedCreateInput | Prisma.SalonBranchUncheckedUpdateInput;

function trimRequired(value: string, minimumLength = 1): string {
  const trimmed = value.trim();
  if (trimmed.length < minimumLength) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return trimmed;
}

function optionalTrim(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function optionalTrimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function assertTimezone(value: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
  } catch {
    throw new UnprocessableEntityException(validationMessage);
  }
}

function assertCurrency(value: string): void {
  if (!/^[A-Z]{3}$/.test(value) || (supportedCurrencyCodes.size > 0 && !supportedCurrencyCodes.has(value))) {
    throw new UnprocessableEntityException(validationMessage);
  }
}

function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.roles.some((entry) => {
    const roleName = typeof entry === 'string' ? entry : typeof entry?.name === 'string' ? String(entry.name) : undefined;
    return roleName?.toLowerCase() === role.toLowerCase();
  });
}

function hashIdempotencyPayload(input: unknown): string {
  return createHash('sha256')
    .update(
      JSON.stringify(input, (_key, value: unknown) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return value;
        }

        return Object.keys(value as Record<string, unknown>)
          .sort()
          .reduce<Record<string, unknown>>((result, key) => {
            result[key] = (value as Record<string, unknown>)[key];
            return result;
          }, {});
      }),
    )
    .digest('hex');
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];
}

function readManagedTenantIds(user: AuthenticatedUser): string[] {
  const direct = readStringArray(user['managedTenants']);
  if (direct.length > 0) {
    return direct;
  }

  const saasOwner = user['saasOwner'];
  if (!saasOwner || typeof saasOwner !== 'object' || Array.isArray(saasOwner)) {
    return [];
  }

  return readStringArray((saasOwner as Record<string, unknown>)['managedTenants']);
}

function normalizePosition(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  return normalized && normalized.length > 0 ? normalized : null;
}

function isBranchManagerPosition(value: string | null | undefined): boolean {
  const normalized = normalizePosition(value);
  return normalized !== null && branchManagerPositions.has(normalized);
}

function parseMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return hours * 60 + minutes;
}

function readLocalTimeSlot(value: Date, timezone: string): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(value);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hours = parts.find((part) => part.type === 'hour')?.value;
  const minutes = parts.find((part) => part.type === 'minute')?.value;
  const dayOfWeek = weekday ? weekdayByShortName[weekday] : undefined;
  if (dayOfWeek === undefined || hours === undefined || minutes === undefined) {
    throw new UnprocessableEntityException(validationMessage);
  }

  return {
    dayOfWeek,
    minutes: Number(hours) * 60 + Number(minutes),
  };
}

function assertIntervals(intervals: readonly TimeIntervalModel[]): void {
  const sorted = intervals
    .map((interval) => ({
      ...interval,
      startMinutes: parseMinutes(interval.start),
      endMinutes: parseMinutes(interval.end),
    }))
    .sort((left, right) => left.startMinutes - right.startMinutes);

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current.startMinutes >= current.endMinutes) {
      throw new UnprocessableEntityException(validationMessage);
    }

    const previous = sorted[index - 1];
    if (previous && previous.endMinutes > current.startMinutes) {
      throw new UnprocessableEntityException(validationMessage);
    }
  }
}

function normalizeWeeklyDays(input: WeeklyHoursInputDto): WeeklyHoursDayModel[] {
  assertTimezone(input.timezone);

  const seen = new Set<number>();
  const days = input.days.map((day) => {
    if (seen.has(day.dayOfWeek)) {
      throw new UnprocessableEntityException(validationMessage);
    }
    seen.add(day.dayOfWeek);

    const intervals = day.intervals.map((interval) => ({ start: interval.start, end: interval.end }));
    assertIntervals(intervals);

    if (day.open && intervals.length === 0) {
      throw new UnprocessableEntityException(validationMessage);
    }

    if (!day.open && intervals.length > 0) {
      throw new UnprocessableEntityException(validationMessage);
    }

    return {
      dayOfWeek: day.dayOfWeek,
      open: day.open,
      intervals,
    };
  });

  if (seen.size !== 7 || ![0, 1, 2, 3, 4, 5, 6].every((day) => seen.has(day))) {
    throw new UnprocessableEntityException(validationMessage);
  }

  return days.sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

function isAppointmentInsideHours(
  startTime: Date,
  endTime: Date,
  timezone: string,
  weeklyHours: ReadonlyMap<number, WeeklyHoursDayModel>,
): boolean {
  const localStart = readLocalTimeSlot(startTime, timezone);
  const localEnd = readLocalTimeSlot(endTime, timezone);
  if (localStart.dayOfWeek !== localEnd.dayOfWeek || localEnd.minutes <= localStart.minutes) {
    return false;
  }

  const day = weeklyHours.get(localStart.dayOfWeek);
  if (!day?.open) {
    return false;
  }

  return day.intervals.some((interval) => {
    const intervalStart = parseMinutes(interval.start);
    const intervalEnd = parseMinutes(interval.end);
    return intervalStart <= localStart.minutes && intervalEnd >= localEnd.minutes;
  });
}

function normalizeHolidayIntervals(input: BranchHolidayInputDto): TimeIntervalModel[] {
  const intervals = input.intervals?.map((interval) => ({ start: interval.start, end: interval.end })) ?? [];
  assertIntervals(intervals);

  if (input.closed && intervals.length > 0) {
    throw new UnprocessableEntityException(validationMessage);
  }

  if (!input.closed && intervals.length === 0) {
    throw new UnprocessableEntityException(validationMessage);
  }

  return intervals;
}

function parseLocalDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new UnprocessableEntityException(validationMessage);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return date;
}

function normalizeAddress(input: BranchProfileInputDto['address']): SalonOwnerAddress {
  const country = trimRequired(input.country).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    throw new UnprocessableEntityException(validationMessage);
  }

  return {
    line1: trimRequired(input.line1),
    ...(optionalTrim(input.line2) ? { line2: optionalTrim(input.line2) } : {}),
    city: trimRequired(input.city),
    state: trimRequired(input.state),
    postalCode: trimRequired(input.postalCode),
    country,
  };
}

function readAddress(value: Prisma.JsonValue): SalonOwnerAddress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Stored branch address is not an object');
  }

  const address = value as Record<string, unknown>;
  return {
    line1: readStoredString(address, 'line1'),
    ...(typeof address['line2'] === 'string' ? { line2: address['line2'] } : {}),
    city: readStoredString(address, 'city'),
    state: readStoredString(address, 'state'),
    postalCode: readStoredString(address, 'postalCode'),
    country: readStoredString(address, 'country'),
  };
}

function readStoredString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function toJsonArray(intervals: readonly TimeIntervalModel[]): Prisma.InputJsonValue {
  return intervals.map((interval) => ({ start: interval.start, end: interval.end }));
}

function isUniqueConstraintViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002';
  }

  return error instanceof Error && error.message === translatedUniqueConstraintMessage;
}

@Injectable()
export class SalonOwnerSettingsService {
  private static readonly defaultPageNumber = 1;
  private static readonly defaultPageSize = 25;
  private static readonly maxPageSize = 100;

  constructor(private readonly prisma: PrismaService) {}

  async listBusinesses(context: SalonOwnerRequestContext, pagination: SalonOwnerPagination = {}): Promise<PagedResult<SalonBusinessModel>> {
    const tenantIds = await this.requireTenantIds(context);
    const page = this.normalizePagination(pagination);
    const where = { tenantId: this.tenantScopeFilter(tenantIds) } as const;
    const [businesses, totalItems] = await Promise.all([
      this.prisma.salonBusiness.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page.pageNumber - 1) * page.limit,
        take: page.limit,
      }),
      this.prisma.salonBusiness.count({ where }),
    ]);

    return this.page(
      businesses.map((business) => this.mapBusiness(business)),
      page.pageNumber,
      page.limit,
      totalItems,
    );
  }

  async createBusiness(context: SalonOwnerRequestContext, input: SalonBusinessInputDto): Promise<SalonBusinessModel> {
    this.requireAdminSupportContext(context);
    const tenantId = await this.requireTenantId(context);
    const requestHash = hashIdempotencyPayload(input);

    try {
      const business = await this.prisma.$transaction(
        async (tx: TransactionClient) => {
          const replayed = await this.findIdempotentBusinessReplay(tx, context, tenantId, requestHash);
          if (replayed) {
            return replayed;
          }

          const created = await tx.salonBusiness.create({
            data: {
              tenantId,
              displayName: trimRequired(input.displayName, 2),
              legalName: trimRequired(input.legalName, 2),
              status: input.status as PrismaSalonOwnerStatus,
            },
          });
          await this.recordIdempotentCreate(tx, context, tenantId, 'salon_owner.business.create.idempotency', requestHash, created.id);
          await this.createAuditEvent(tx, context, tenantId, 'salon_owner.business.create', created.id);
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.mapBusiness(business);
    } catch (error) {
      const replayed = await this.findIdempotentBusinessReplay(this.prisma, context, tenantId, requestHash);
      if (replayed) {
        return this.mapBusiness(replayed);
      }
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(duplicateBusinessMessage);
      }
      throw error;
    }
  }

  async getBusiness(context: SalonOwnerRequestContext, businessId: string): Promise<SalonBusinessModel> {
    return this.mapBusiness(await this.findBusinessInScope(context, businessId));
  }

  async updateBusiness(context: SalonOwnerRequestContext, businessId: string, input: SalonBusinessInputDto): Promise<SalonBusinessModel> {
    this.requireAdminSupportContext(context);
    const current = await this.findBusinessInScope(context, businessId);
    const tenantIds = await this.requireTenantIds(context);

    try {
      const business = await this.prisma.$transaction(
        async (tx: TransactionClient) => {
          const scopedBusiness = await tx.salonBusiness.findFirst({
            where: {
              id: businessId,
              tenantId: this.tenantScopeFilter(tenantIds),
            },
          });
          if (!scopedBusiness) {
            throw new NotFoundException(notFoundMessage);
          }
          await this.lockBusiness(tx, scopedBusiness.id);

          if (scopedBusiness.status !== PrismaSalonOwnerStatus.INACTIVE && input.status === 'INACTIVE') {
            const activeBranchCount = await tx.salonBranch.count({
              where: {
                businessId,
                status: PrismaSalonOwnerStatus.ACTIVE,
              },
            });

            if (activeBranchCount > 0) {
              throw new ConflictException(businessStatusConflictMessage);
            }
          }

          const updated = await tx.salonBusiness.update({
            where: { id: businessId },
            data: {
              displayName: trimRequired(input.displayName, 2),
              legalName: trimRequired(input.legalName, 2),
              status: input.status as PrismaSalonOwnerStatus,
            },
          });
          await this.createAuditEvent(tx, context, current.tenantId, 'salon_owner.business.update', businessId);
          return updated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.mapBusiness(business);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(duplicateBusinessMessage);
      }
      throw error;
    }
  }

  async listBranches(
    context: SalonOwnerRequestContext,
    businessId?: string,
    filters: BranchListFilters = {},
    pagination: SalonOwnerPagination = {},
  ): Promise<PagedResult<BranchProfileModel>> {
    const tenantIds = await this.requireTenantIds(context);
    const managedBranchIds = await this.readManagedBranchIds(context, tenantIds);
    if (businessId && !managedBranchIds) {
      await this.findBusinessInScope(context, businessId);
    }
    const page = this.normalizePagination(pagination);
    const search = optionalTrim(filters.q);
    const where = {
      ...(managedBranchIds ? { id: { in: managedBranchIds } } : {}),
      ...(businessId ? { businessId } : {}),
      ...(filters.status ? { status: filters.status as PrismaSalonOwnerStatus } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      business: { tenantId: this.tenantScopeFilter(tenantIds) },
    };

    const [branches, totalItems] = await Promise.all([
      this.prisma.salonBranch.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page.pageNumber - 1) * page.limit,
        take: page.limit,
      }),
      this.prisma.salonBranch.count({ where }),
    ]);

    return this.page(
      branches.map((branch) => this.mapBranch(branch)),
      page.pageNumber,
      page.limit,
      totalItems,
    );
  }

  async createBranch(context: SalonOwnerRequestContext, input: BranchProfileInputDto): Promise<BranchProfileModel> {
    this.requireAdminSupportContext(context);
    const tenantIds = await this.requireTenantIds(context);
    const requestHash = hashIdempotencyPayload(input);

    try {
      const branch = await this.runSerializableTransaction(async (tx: TransactionClient) => {
        const business = await tx.salonBusiness.findFirst({
          where: {
            id: input.businessId,
            tenantId: this.tenantScopeFilter(tenantIds),
          },
        });
        if (!business) {
          throw new NotFoundException(notFoundMessage);
        }
        await this.lockBusiness(tx, business.id);
        const replayed = await this.findIdempotentBranchReplay(tx, context, business.tenantId, requestHash);
        if (replayed) {
          return replayed;
        }
        if (business.status === PrismaSalonOwnerStatus.INACTIVE) {
          throw new ConflictException(inactiveBusinessMessage);
        }

        const branchId = randomUUID();
        const data = this.normalizeBranchCreateInput(input, business.id, branchId);
        const created = await tx.salonBranch.create({ data });
        await this.upsertOperationalSalon(tx, context, business, created);
        await this.recordIdempotentCreate(tx, context, business.tenantId, 'salon_owner.branch.create.idempotency', requestHash, created.id);
        await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.create', created.id);
        return created;
      });
      return this.mapBranch(branch);
    } catch (error) {
      const business = await this.findBusinessInScope(context, input.businessId);
      const replayed = await this.findIdempotentBranchReplay(this.prisma, context, business.tenantId, requestHash);
      if (replayed) {
        return this.mapBranch(replayed);
      }
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(duplicateBranchMessage);
      }
      throw error;
    }
  }

  async getBranch(context: SalonOwnerRequestContext, branchId: string): Promise<BranchProfileModel> {
    return this.mapBranch(await this.findBranchInScope(context, branchId));
  }

  async getBranchHours(context: SalonOwnerRequestContext, branchId: string): Promise<BranchHoursModel> {
    const branch = await this.findBranchInScope(context, branchId);
    const rows = await this.prisma.salonBranchHours.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' },
    });
    if (rows.length === 0) {
      return this.emptyHours(branch.id, branch.timezone);
    }

    return this.mapHours(branchId, rows);
  }

  async listBranchHolidays(context: SalonOwnerRequestContext, branchId: string): Promise<BranchHolidayListModel> {
    await this.findBranchInScope(context, branchId);
    const holidays = await this.prisma.salonBranchHoliday.findMany({
      where: { branchId },
      orderBy: { date: 'asc' },
    });

    return {
      items: holidays.map((holiday) => this.mapHoliday(holiday)),
    };
  }

  async getBranchPolicy(context: SalonOwnerRequestContext, branchId: string): Promise<BranchPolicyModel> {
    await this.findBranchInScope(context, branchId);
    const policy = await this.prisma.salonBranchPolicy.findUnique({
      where: { branchId },
    });

    return policy ? this.mapPolicy(policy) : this.defaultPolicy(branchId);
  }

  async updateBranch(context: SalonOwnerRequestContext, branchId: string, input: BranchProfileInputDto): Promise<BranchProfileModel> {
    this.requireAdminSupportContext(context);
    const current = await this.findBranchInScope(context, branchId);
    if (current.businessId !== input.businessId) {
      throw new ForbiddenException(forbiddenMessage);
    }

    const business = await this.findBusinessInScope(context, current.businessId);
    const tenantIds = await this.requireTenantIds(context);

    try {
      const branch = await this.runSerializableTransaction(async (tx: TransactionClient) => {
        const scopedBusiness = await tx.salonBusiness.findFirst({
          where: {
            id: current.businessId,
            tenantId: this.tenantScopeFilter(tenantIds),
          },
        });
        if (!scopedBusiness) {
          throw new NotFoundException(notFoundMessage);
        }
        if (input.status === 'ACTIVE' && scopedBusiness.status === PrismaSalonOwnerStatus.INACTIVE) {
          throw new ConflictException(inactiveBusinessMessage);
        }
        if (input.currency.toUpperCase() !== current.currency && current.currencyLockedAt) {
          throw new ConflictException(branchCurrencyLockedMessage);
        }
        if (current.status !== PrismaSalonOwnerStatus.INACTIVE && input.status === 'INACTIVE') {
          const futureConfirmedAppointmentCount = await tx.appointment.count({
            where: {
              status: { in: [...confirmedAppointmentStatuses] },
              startTime: { gt: new Date() },
              services: {
                some: {
                  salonService: {
                    salonId: branchId,
                  },
                },
              },
            },
          });

          if (futureConfirmedAppointmentCount > 0) {
            throw new ConflictException(branchArchiveBlockedMessage);
          }
        }

        const updated = await tx.salonBranch.update({
          where: { id: branchId },
          data: this.normalizeBranchUpdateInput(input, input.businessId),
        });
        await this.upsertOperationalSalon(tx, context, scopedBusiness, updated);
        if (input.timezone !== current.timezone) {
          await tx.salonBranchHours.updateMany({
            where: { branchId },
            data: { timezone: input.timezone },
          });
        }
        await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.update', branchId);
        return updated;
      });
      return this.mapBranch(branch);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(duplicateBranchMessage);
      }
      throw error;
    }
  }

  async replaceBranchHours(context: SalonOwnerRequestContext, branchId: string, input: WeeklyHoursInputDto): Promise<BranchHoursModel> {
    this.requireAdminSupportContext(context);
    const days = normalizeWeeklyDays(input);
    const weeklyHoursByDay = new Map(days.map((day) => [day.dayOfWeek, day] as const));
    const tenantIds = await this.requireTenantIds(context);
    const managedBranchIds = await this.readManagedBranchIds(context, tenantIds);
    await this.prisma.$transaction(
      async (tx: TransactionClient) => {
        const branch = await tx.salonBranch.findFirst({
          where: {
            AND: [
              { id: branchId },
              ...(managedBranchIds ? [{ id: { in: managedBranchIds } }] : []),
            ],
            business: { tenantId: this.tenantScopeFilter(tenantIds) },
          },
          include: {
            business: {
              select: {
                tenantId: true,
              },
            },
          },
        });
        if (!branch) {
          throw new NotFoundException(notFoundMessage);
        }
        if (input.timezone !== branch.timezone) {
          throw new UnprocessableEntityException(validationMessage);
        }

        const appointmentsOutsideHours = await tx.appointment.findMany({
          where: {
            status: { in: [...schedulableAppointmentStatuses] },
            startTime: { gt: new Date() },
            services: {
              some: {
                salonService: {
                  salonId: branchId,
                },
              },
            },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        });
        const outsideScheduleAppointments = appointmentsOutsideHours.filter(
          (appointment) => !isAppointmentInsideHours(appointment.startTime, appointment.endTime, branch.timezone, weeklyHoursByDay),
        );
        if (outsideScheduleAppointments.length > 0 && input.acknowledgeExistingAppointmentsOutsideHours !== true) {
          throw new ConflictException(branchHoursConflictMessage);
        }

        await tx.salonBranchHours.deleteMany({ where: { branchId } });
        await tx.salonBranchHours.createMany({
          data: days.map((day) => ({
            branchId,
            timezone: input.timezone,
            dayOfWeek: day.dayOfWeek,
            open: day.open,
            intervals: toJsonArray(day.intervals),
          })),
        });
        await this.createAuditEvent(tx, context, branch.business.tenantId, 'salon_owner.branch.hours.replace', branchId, {
          ...(outsideScheduleAppointments.length > 0
            ? {
                appointmentOutsideHoursAcknowledged: true,
                affectedAppointmentCount: outsideScheduleAppointments.length,
              }
            : {}),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return {
      branchId,
      timezone: input.timezone,
      days,
    };
  }

  async setBranchHoliday(
    context: SalonOwnerRequestContext,
    branchId: string,
    date: string,
    input: BranchHolidayInputDto,
  ): Promise<BranchHolidayModel> {
    this.requireAdminSupportContext(context);
    const holidayDate = parseLocalDate(date);
    const intervals = normalizeHolidayIntervals(input);
    const branch = await this.findBranchInScope(context, branchId);
    const business = await this.findBusinessInScope(context, branch.businessId);

    const holiday = await this.prisma.$transaction(async (tx: TransactionClient) => {
      const upserted = await tx.salonBranchHoliday.upsert({
        where: { branchId_date: { branchId, date: holidayDate } },
        create: {
          branchId,
          date: holidayDate,
          closed: input.closed,
          reason: optionalTrimOrNull(input.reason),
          intervals: toJsonArray(intervals),
        },
        update: {
          closed: input.closed,
          reason: optionalTrimOrNull(input.reason),
          intervals: toJsonArray(intervals),
        },
      });
      await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.holiday.set', branchId);
      return upserted;
    });

    return this.mapHoliday(holiday);
  }

  async updateBranchPolicy(context: SalonOwnerRequestContext, branchId: string, input: BranchPolicyInputDto): Promise<BranchPolicyModel> {
    this.requireAdminSupportContext(context);
    const branch = await this.findBranchInScope(context, branchId);
    const business = await this.findBusinessInScope(context, branch.businessId);

    const policy = await this.prisma.$transaction(async (tx: TransactionClient) => {
      const upserted = await tx.salonBranchPolicy.upsert({
        where: { branchId },
        create: {
          branchId,
          bookingLeadMinutes: input.bookingLeadMinutes,
          cancellationCutoffMinutes: input.cancellationCutoffMinutes,
          noShowGraceMinutes: input.noShowGraceMinutes,
        },
        update: {
          bookingLeadMinutes: input.bookingLeadMinutes,
          cancellationCutoffMinutes: input.cancellationCutoffMinutes,
          noShowGraceMinutes: input.noShowGraceMinutes,
        },
      });
      await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.policy.update', branchId);
      return upserted;
    });

    return this.mapPolicy(policy);
  }

  private async requireTenantIds(context: SalonOwnerRequestContext): Promise<string[]> {
    if (typeof context.user.tenantId === 'string' && context.user.tenantId.trim().length > 0) {
      return [context.user.tenantId];
    }

    if (hasRole(context.user, UserRole.ADMIN)) {
      const managedTenantIds = readManagedTenantIds(context.user);
      if (managedTenantIds.length > 0) {
        return [...new Set(managedTenantIds)];
      }

      const persistedManagedTenantIds = await this.readPersistedManagedTenantIds(context.user.id);
      if (persistedManagedTenantIds.length > 0) {
        return persistedManagedTenantIds;
      }
    }

    throw new ForbiddenException(forbiddenMessage);
  }

  private async requireTenantId(context: SalonOwnerRequestContext): Promise<string> {
    const tenantIds = await this.requireTenantIds(context);
    if (tenantIds.length !== 1) {
      throw new ForbiddenException(forbiddenMessage);
    }

    return tenantIds[0];
  }

  private tenantScopeFilter(tenantIds: readonly string[]): string | { in: string[] } {
    return tenantIds.length === 1 ? tenantIds[0] : { in: [...tenantIds] };
  }

  private parseIdempotencyRecord(reason: string | null): { requestHash: string; resourceId: string } | null {
    if (!reason) {
      return null;
    }

    const [requestHash, resourceId] = reason.split(':', 2);
    if (!requestHash || !resourceId) {
      return null;
    }

    return { requestHash, resourceId };
  }

  private async recordIdempotentCreate(
    tx: Pick<TransactionClient, 'auditEvent'>,
    context: SalonOwnerRequestContext,
    tenantId: string,
    action: string,
    requestHash: string,
    resourceId: string,
  ): Promise<void> {
    const idempotencyKey = context.idempotencyKey;
    if (!idempotencyKey) {
      return;
    }

    await tx.auditEvent.create({
      data: {
        userId: context.user.id,
        tenantId,
        action,
        result: 'success',
        reason: `${requestHash}:${resourceId}`,
        correlationId: idempotencyKey,
        targetId: resourceId,
      },
    });
  }

  private async findIdempotentBusinessReplay(
    prisma: Pick<TransactionClient, 'auditEvent' | 'salonBusiness'>,
    context: SalonOwnerRequestContext,
    tenantId: string,
    requestHash: string,
  ): Promise<BusinessRecord | null> {
    const idempotencyKey = context.idempotencyKey;
    if (!idempotencyKey) {
      return null;
    }

    const record = await prisma.auditEvent.findFirst({
      where: {
        userId: context.user.id,
        tenantId,
        action: 'salon_owner.business.create.idempotency',
        correlationId: idempotencyKey,
      },
      orderBy: { ts: 'desc' },
    });
    const parsed = this.parseIdempotencyRecord(record?.reason ?? null);
    if (!parsed) {
      return null;
    }
    if (parsed.requestHash !== requestHash) {
      throw new ConflictException(conflictMessage);
    }

    const business = await prisma.salonBusiness.findFirst({
      where: {
        id: parsed.resourceId,
        tenantId,
      },
    });
    return business ?? null;
  }

  private async findIdempotentBranchReplay(
    prisma: Pick<TransactionClient, 'auditEvent' | 'salonBranch'>,
    context: SalonOwnerRequestContext,
    tenantId: string,
    requestHash: string,
  ): Promise<BranchRecord | null> {
    const idempotencyKey = context.idempotencyKey;
    if (!idempotencyKey) {
      return null;
    }

    const record = await prisma.auditEvent.findFirst({
      where: {
        userId: context.user.id,
        tenantId,
        action: 'salon_owner.branch.create.idempotency',
        correlationId: idempotencyKey,
      },
      orderBy: { ts: 'desc' },
    });
    const parsed = this.parseIdempotencyRecord(record?.reason ?? null);
    if (!parsed) {
      return null;
    }
    if (parsed.requestHash !== requestHash) {
      throw new ConflictException(conflictMessage);
    }

    const branch = await prisma.salonBranch.findFirst({
      where: {
        id: parsed.resourceId,
        business: { tenantId },
      },
    });
    return branch ?? null;
  }

  private async findBusinessInScope(context: SalonOwnerRequestContext, businessId: string): Promise<BusinessRecord> {
    const tenantIds = await this.requireTenantIds(context);
    const business = await this.prisma.salonBusiness.findFirst({
      where: {
        id: businessId,
        tenantId: this.tenantScopeFilter(tenantIds),
      },
    });

    if (!business) {
      throw new NotFoundException(notFoundMessage);
    }

    return business;
  }

  private async findBranchInScope(context: SalonOwnerRequestContext, branchId: string): Promise<BranchRecord> {
    const tenantIds = await this.requireTenantIds(context);
    const managedBranchIds = await this.readManagedBranchIds(context, tenantIds);
    const branch = await this.prisma.salonBranch.findFirst({
      where: {
        AND: [
          { id: branchId },
          ...(managedBranchIds ? [{ id: { in: managedBranchIds } }] : []),
        ],
        business: { tenantId: this.tenantScopeFilter(tenantIds) },
      },
    });

    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }

    return branch;
  }

  private async readManagedBranchIds(context: SalonOwnerRequestContext, tenantIds: readonly string[]): Promise<string[] | null> {
    if (hasRole(context.user, UserRole.OWNER) || hasRole(context.user, UserRole.ADMIN)) {
      return null;
    }

    if (!hasRole(context.user, UserRole.STAFF)) {
      throw new ForbiddenException(forbiddenMessage);
    }

    const assignments = await this.prisma.salonTenantStaff.findMany({
      where: {
        userId: context.user.id,
        isActive: true,
        salon: {
          tenantId: this.tenantScopeFilter(tenantIds),
        },
      },
      select: {
        salonId: true,
        position: true,
      },
    });

    const managedBranchIds = assignments
      .filter((assignment) => isBranchManagerPosition(assignment.position))
      .map((assignment) => assignment.salonId);

    if (managedBranchIds.length === 0) {
      throw new ForbiddenException(forbiddenMessage);
    }

    return [...new Set(managedBranchIds)];
  }

  private async readPersistedManagedTenantIds(userId: string): Promise<string[]> {
    const saasOwner = await this.prisma.saasOwner.findUnique({
      where: { userId },
      select: { managedTenants: true },
    });

    return [...new Set(readStringArray(saasOwner?.managedTenants))];
  }

  private async runSerializableTransaction<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      attempt += 1;
      try {
        return await this.prisma.$transaction(callback, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt === 2) {
          throw error;
        }
      }
    }
  }

  private requireAdminSupportContext(context: SalonOwnerRequestContext): void {
    if (!hasRole(context.user, UserRole.ADMIN) || hasRole(context.user, UserRole.OWNER)) {
      return;
    }

    const supportContext = this.normalizeSupportContext(context.supportContext);
    if (!supportContext) {
      throw new ForbiddenException(forbiddenMessage);
    }
  }

  private normalizeSupportContext(supportContext?: SalonOwnerSupportContext): SalonOwnerSupportContext | null {
    const reference = supportContext?.reference?.trim();
    const reason = supportContext?.reason?.trim();
    if (!reference || !reason) {
      return null;
    }

    return { reference, reason };
  }

  private async lockBusiness(tx: Pick<TransactionClient, '$queryRaw'>, businessId: string): Promise<void> {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "salon_business" WHERE id = ${businessId}::uuid FOR UPDATE`);
  }

  private normalizeBranchCreateInput(
    input: BranchProfileInputDto,
    businessId: string,
    branchId = randomUUID(),
  ): Prisma.SalonBranchUncheckedCreateInput {
    assertTimezone(input.timezone);
    const currency = input.currency.toUpperCase();
    assertCurrency(currency);

    return {
      id: branchId,
      businessId,
      name: trimRequired(input.name, 2),
      phone: optionalTrimOrNull(input.phone),
      email: optionalTrimOrNull(input.email),
      timezone: input.timezone,
      currency,
      status: input.status as PrismaSalonOwnerStatus,
      address: normalizeAddress(input.address) as unknown as Prisma.InputJsonObject,
    };
  }

  private normalizeBranchUpdateInput(input: BranchProfileInputDto, businessId: string): Prisma.SalonBranchUncheckedUpdateInput {
    const phoneProvided = Object.prototype.hasOwnProperty.call(input, 'phone');
    const emailProvided = Object.prototype.hasOwnProperty.call(input, 'email');
    const {
      id: _id,
      phone: _phone,
      email: _email,
      ...data
    } = this.normalizeBranchCreateInput(input, businessId) as BranchMutationData & { id: string };

    return {
      ...data,
      ...(phoneProvided ? { phone: optionalTrimOrNull(input.phone) } : {}),
      ...(emailProvided ? { email: optionalTrimOrNull(input.email) } : {}),
    };
  }

  private async upsertOperationalSalon(
    tx: TransactionClient,
    context: SalonOwnerRequestContext,
    business: BusinessRecord,
    branch: BranchRecord,
  ): Promise<void> {
    const address = readAddress(branch.address);
    const [country, existingSalon] = await Promise.all([
      this.resolveCountry(tx, address.country),
      tx.salon.findUnique({
        where: { id: branch.id },
        select: {
          id: true,
          ownerId: true,
          metadata: true,
        },
      }),
    ]);
    const state = await this.resolveState(tx, country.id, address.state);
    const city = await this.resolveCity(tx, country.id, state.id, address.city);
    const ownerId = existingSalon?.ownerId ?? (await this.resolveSalonOwnerId(tx, context, business));
    const mergedMetadata = this.mergeSalonMetadata(existingSalon?.metadata ?? null, branch.timezone);

    await tx.salon.upsert({
      where: { id: branch.id },
      create: {
        id: branch.id,
        tenant: { connect: { id: business.tenantId } },
        owner: { connect: { id: ownerId } },
        name: branch.name,
        slug: this.buildSalonSlug(branch.name, branch.id),
        phone: branch.phone,
        email: branch.email,
        isActive: branch.status === PrismaSalonOwnerStatus.ACTIVE,
        metadata: mergedMetadata,
        businessAddress: {
          create: {
            line1: address.line1,
            line2: address.line2 ?? null,
            postalCode: address.postalCode,
            isActive: branch.status === PrismaSalonOwnerStatus.ACTIVE,
            country: { connect: { id: country.id } },
            state: { connect: { id: state.id } },
            city: { connect: { id: city.id } },
          },
        },
      },
      update: {
        tenant: { connect: { id: business.tenantId } },
        owner: { connect: { id: ownerId } },
        name: branch.name,
        phone: branch.phone,
        email: branch.email,
        isActive: branch.status === PrismaSalonOwnerStatus.ACTIVE,
        metadata: mergedMetadata,
        businessAddress: {
          update: {
            line1: address.line1,
            line2: address.line2 ?? null,
            postalCode: address.postalCode,
            isActive: branch.status === PrismaSalonOwnerStatus.ACTIVE,
            country: { connect: { id: country.id } },
            state: { connect: { id: state.id } },
            city: { connect: { id: city.id } },
          },
        },
      },
    });
  }

  private async resolveSalonOwnerId(tx: TransactionClient, context: SalonOwnerRequestContext, business: BusinessRecord): Promise<string> {
    const businessSalon = await tx.salon.findUnique({
      where: { id: business.id },
      select: { ownerId: true },
    });
    if (businessSalon?.ownerId) {
      return businessSalon.ownerId;
    }

    if (hasRole(context.user, UserRole.OWNER)) {
      return context.user.id;
    }

    const tenantOwner = await tx.user.findFirst({
      where: {
        salonTenantId: business.tenantId,
        isActive: true,
        roles: {
          some: {
            role: {
              name: {
                in: [UserRole.OWNER, UserRole.OWNER.toUpperCase()],
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (tenantOwner?.id) {
      return tenantOwner.id;
    }

    throw new ConflictException('error.branch.profile.owner_missing');
  }

  private async resolveCountry(tx: TransactionClient, iso2: string) {
    const country = await tx.country.findUnique({
      where: { iso2 },
      select: { id: true },
    });
    if (!country) {
      throw new UnprocessableEntityException(validationMessage);
    }
    return country;
  }

  private async resolveState(tx: TransactionClient, countryId: string, stateName: string) {
    const state = await tx.state.findFirst({
      where: {
        countryId,
        OR: [
          { stateCode: stateName.trim().toUpperCase() },
          {
            name: {
              equals: stateName,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: { id: true },
    });
    if (state) {
      return state;
    }

    await tx.state.createMany({
      data: [
        {
          countryId,
          name: stateName,
          stateCode: this.buildSyntheticStateCode(countryId, stateName),
        },
      ],
      skipDuplicates: true,
    });

    const existingState = await tx.state.findFirst({
      where: {
        countryId,
        OR: [
          { stateCode: stateName.trim().toUpperCase() },
          {
            name: {
              equals: stateName,
              mode: 'insensitive',
            },
          },
          {
            stateCode: this.buildSyntheticStateCode(countryId, stateName),
          },
        ],
      },
      select: { id: true },
    });
    if (existingState) {
      return existingState;
    }

    throw new ConflictException(conflictMessage);
  }

  private async resolveCity(tx: TransactionClient, countryId: string, stateId: string, cityName: string) {
    const city = await tx.city.findFirst({
      where: {
        countryId,
        stateId,
        name: {
          equals: cityName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    if (city) {
      return city;
    }

    await tx.city.createMany({
      data: [
        {
          countryId,
          stateId,
          name: cityName,
        },
      ],
      skipDuplicates: true,
    });

    const existingCity = await tx.city.findFirst({
      where: {
        countryId,
        stateId,
        name: {
          equals: cityName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    if (existingCity) {
      return existingCity;
    }

    throw new ConflictException(conflictMessage);
  }

  private buildSyntheticStateCode(countryId: string, stateName: string): string {
    const prefix =
      stateName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8) || 'STATE';
    const suffix = createHash('sha1').update(`${countryId}:${stateName.toLowerCase()}`).digest('hex').slice(0, 4).toUpperCase();
    return `${prefix}-${suffix}`;
  }

  private buildSalonSlug(name: string, branchId: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    return `${base || 'salon'}-${branchId.toLowerCase()}`;
  }

  private mergeSalonMetadata(metadata: Prisma.JsonValue | null, timezone: string): Prisma.InputJsonValue {
    const metadataObject = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...metadata } : {};
    return {
      ...metadataObject,
      timezone,
    };
  }

  private async createAuditEvent(
    tx: TransactionClient,
    context: SalonOwnerRequestContext,
    tenantId: string,
    action: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const reason = this.buildAuditReason(context, metadata);
    await tx.auditEvent.create({
      data: {
        userId: context.user.id,
        tenantId,
        action,
        targetId,
        result: 'success',
        ...(reason ? { reason } : {}),
        correlationId: CorrelationId.get() ?? null,
      },
    });
  }

  private buildAuditReason(context: SalonOwnerRequestContext, metadata?: Record<string, unknown>): string | undefined {
    const supportContext = this.normalizeSupportContext(context.supportContext);
    if (!supportContext && (!metadata || Object.keys(metadata).length === 0)) {
      return undefined;
    }

    return JSON.stringify({
      ...(supportContext ? { supportContext } : {}),
      ...(metadata && Object.keys(metadata).length > 0 ? metadata : {}),
    });
  }

  private mapBusiness(business: BusinessRecord): SalonBusinessModel {
    return {
      id: business.id,
      tenantId: business.tenantId,
      displayName: business.displayName,
      legalName: business.legalName,
      status: business.status,
      createdAt: toIso(business.createdAt),
      updatedAt: toIso(business.updatedAt),
    };
  }

  private mapBranch(branch: BranchRecord): BranchProfileModel {
    return {
      id: branch.id,
      businessId: branch.businessId,
      name: branch.name,
      ...(branch.phone ? { phone: branch.phone } : {}),
      ...(branch.email ? { email: branch.email } : {}),
      timezone: branch.timezone,
      currency: branch.currency,
      status: branch.status as BranchProfileModel['status'],
      address: readAddress(branch.address),
      createdAt: toIso(branch.createdAt),
      updatedAt: toIso(branch.updatedAt),
    };
  }

  private mapHoliday(holiday: HolidayRecord): BranchHolidayModel {
    return {
      branchId: holiday.branchId,
      date: holiday.date.toISOString().slice(0, 10),
      closed: holiday.closed,
      ...(holiday.reason ? { reason: holiday.reason } : {}),
      intervals: this.readIntervals(holiday.intervals),
    };
  }

  private mapHours(branchId: string, rows: readonly HoursRecord[]): BranchHoursModel {
    return {
      branchId,
      timezone: rows[0]?.timezone ?? '',
      days: rows.map((row) => ({
        dayOfWeek: row.dayOfWeek,
        open: row.open,
        intervals: this.readIntervals(row.intervals),
      })),
    };
  }

  private emptyHours(branchId: string, timezone: string): BranchHoursModel {
    return {
      branchId,
      timezone,
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        open: false,
        intervals: [],
      })),
    };
  }

  private defaultPolicy(branchId: string): BranchPolicyModel {
    return {
      branchId,
      bookingLeadMinutes: 0,
      cancellationCutoffMinutes: 0,
      noShowGraceMinutes: 0,
    };
  }

  private mapPolicy(policy: PolicyRecord): BranchPolicyModel {
    return {
      branchId: policy.branchId,
      bookingLeadMinutes: policy.bookingLeadMinutes,
      cancellationCutoffMinutes: policy.cancellationCutoffMinutes,
      noShowGraceMinutes: policy.noShowGraceMinutes,
    };
  }

  private readIntervals(value: Prisma.JsonValue): TimeIntervalModel[] {
    if (!Array.isArray(value)) {
      throw new Error('Stored intervals are not an array');
    }

    return value.map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error('Stored interval is not an object');
      }
      const interval = entry as Record<string, unknown>;
      return {
        start: readStoredString(interval, 'start'),
        end: readStoredString(interval, 'end'),
      };
    });
  }

  private normalizePagination(pagination: SalonOwnerPagination): { pageNumber: number; limit: number } {
    const pageNumber = pagination.page ?? SalonOwnerSettingsService.defaultPageNumber;
    const limit = pagination.pageSize ?? SalonOwnerSettingsService.defaultPageSize;
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new UnprocessableEntityException(validationMessage);
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > SalonOwnerSettingsService.maxPageSize) {
      throw new UnprocessableEntityException(validationMessage);
    }

    return { pageNumber, limit };
  }

  private page<T>(items: readonly T[], pageNumber: number, limit: number, totalItems: number): PagedResult<T> {
    return {
      items,
      page: {
        pageNumber,
        limit,
        totalItems,
        nextCursor: null,
        hasMore: pageNumber * limit < totalItems,
      },
    };
  }
}
