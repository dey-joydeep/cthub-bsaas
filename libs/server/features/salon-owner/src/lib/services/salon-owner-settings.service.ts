import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, SalonOwnerStatus as PrismaSalonOwnerStatus } from '@prisma/client';
import { COMMON_MESSAGE_KEYS, UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { CorrelationId } from '@cthub-bsaas/server-core';
import { createHash } from 'crypto';

import { BranchHolidayInputDto, BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from '../dto/branch-settings.dto';
import { SalonBusinessInputDto } from '../dto/salon-business.dto';
import {
  BranchHolidayModel,
  BranchHoursModel,
  BranchPolicyModel,
  BranchProfileModel,
  PagedResult,
  SalonBusinessModel,
  SalonOwnerAddress,
  SalonOwnerRequestContext,
  TimeIntervalModel,
  WeeklyHoursDayModel,
} from '../models/salon-owner-settings.models';

const duplicateBusinessMessage = 'error.business.profile.duplicate';
const duplicateBranchMessage = 'error.branch.profile.name.duplicate';
const businessStatusConflictMessage = 'error.business.profile.status_conflict';
const inactiveBusinessMessage = 'error.branch.profile.business_inactive';
const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const conflictMessage = COMMON_MESSAGE_KEYS.ERROR.CONFLICT;
const supportedCurrencyCodes = new Set(
  ((Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('currency') ?? []).map((code) =>
    code.toUpperCase(),
  ),
);

type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type BusinessRecord = Awaited<ReturnType<PrismaService['salonBusiness']['findFirstOrThrow']>>;
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
    const roleName =
      typeof entry === 'string' ? entry : typeof entry?.name === 'string' ? String(entry.name) : undefined;
    return roleName?.toLowerCase() === role.toLowerCase();
  });
}

function hashIdempotencyPayload(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
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

function parseMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return hours * 60 + minutes;
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

function isDuplicate(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class SalonOwnerSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBusinesses(context: SalonOwnerRequestContext): Promise<PagedResult<SalonBusinessModel>> {
    const tenantIds = this.requireTenantIds(context);
    const businesses = await this.prisma.salonBusiness.findMany({
      where: { tenantId: this.tenantScopeFilter(tenantIds) },
      orderBy: { createdAt: 'asc' },
    });

    return this.page(businesses.map((business) => this.mapBusiness(business)));
  }

  async createBusiness(context: SalonOwnerRequestContext, input: SalonBusinessInputDto): Promise<SalonBusinessModel> {
    const tenantId = this.requireTenantId(context);
    const requestHash = hashIdempotencyPayload(input);

    try {
      const business = await this.prisma.$transaction(async (tx: TransactionClient) => {
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
        await this.createAuditEvent(tx, context, tenantId, 'salon_owner.business.create');
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return this.mapBusiness(business);
    } catch (error) {
      const replayed = await this.findIdempotentBusinessReplay(this.prisma, context, tenantId, requestHash);
      if (replayed) {
        return this.mapBusiness(replayed);
      }
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateBusinessMessage);
      }
      throw error;
    }
  }

  async getBusiness(context: SalonOwnerRequestContext, businessId: string): Promise<SalonBusinessModel> {
    return this.mapBusiness(await this.findBusinessInScope(context, businessId));
  }

  async updateBusiness(context: SalonOwnerRequestContext, businessId: string, input: SalonBusinessInputDto): Promise<SalonBusinessModel> {
    const current = await this.findBusinessInScope(context, businessId);

    try {
      const business = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const scopedBusiness = await tx.salonBusiness.findFirst({
          where: {
            id: businessId,
            tenantId: this.tenantScopeFilter(this.requireTenantIds(context)),
          },
        });
        if (!scopedBusiness) {
          throw new NotFoundException(notFoundMessage);
        }

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
        await this.createAuditEvent(tx, context, current.tenantId, 'salon_owner.business.update');
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return this.mapBusiness(business);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateBusinessMessage);
      }
      throw error;
    }
  }

  async listBranches(context: SalonOwnerRequestContext, businessId?: string): Promise<PagedResult<BranchProfileModel>> {
    const tenantIds = this.requireTenantIds(context);
    if (businessId) {
      await this.findBusinessInScope(context, businessId);
    }

    const branches = await this.prisma.salonBranch.findMany({
      where: {
        ...(businessId ? { businessId } : {}),
        business: { tenantId: this.tenantScopeFilter(tenantIds) },
      },
      orderBy: { createdAt: 'asc' },
    });

    return this.page(branches.map((branch) => this.mapBranch(branch)));
  }

  async createBranch(context: SalonOwnerRequestContext, input: BranchProfileInputDto): Promise<BranchProfileModel> {
    const tenantIds = this.requireTenantIds(context);
    const requestHash = hashIdempotencyPayload(input);

    try {
      const branch = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const business = await tx.salonBusiness.findFirst({
          where: {
            id: input.businessId,
            tenantId: this.tenantScopeFilter(tenantIds),
          },
        });
        if (!business) {
          throw new NotFoundException(notFoundMessage);
        }
        const replayed = await this.findIdempotentBranchReplay(tx, context, business.tenantId, requestHash);
        if (replayed) {
          return replayed;
        }
        if (business.status === PrismaSalonOwnerStatus.INACTIVE) {
          throw new ConflictException(inactiveBusinessMessage);
        }

        const data = this.normalizeBranchCreateInput(input, business.id);
        const created = await tx.salonBranch.create({ data });
        await this.recordIdempotentCreate(tx, context, business.tenantId, 'salon_owner.branch.create.idempotency', requestHash, created.id);
        await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.create');
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return this.mapBranch(branch);
    } catch (error) {
      const business = await this.findBusinessInScope(context, input.businessId);
      const replayed = await this.findIdempotentBranchReplay(this.prisma, context, business.tenantId, requestHash);
      if (replayed) {
        return this.mapBranch(replayed);
      }
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateBranchMessage);
      }
      throw error;
    }
  }

  async getBranch(context: SalonOwnerRequestContext, branchId: string): Promise<BranchProfileModel> {
    return this.mapBranch(await this.findBranchInScope(context, branchId));
  }

  async updateBranch(context: SalonOwnerRequestContext, branchId: string, input: BranchProfileInputDto): Promise<BranchProfileModel> {
    const current = await this.findBranchInScope(context, branchId);
    if (current.businessId !== input.businessId) {
      throw new ForbiddenException(forbiddenMessage);
    }

    const business = await this.findBusinessInScope(context, current.businessId);

    try {
      const branch = await this.prisma.$transaction(async (tx: TransactionClient) => {
        const scopedBusiness = await tx.salonBusiness.findFirst({
          where: {
            id: current.businessId,
            tenantId: this.tenantScopeFilter(this.requireTenantIds(context)),
          },
        });
        if (!scopedBusiness) {
          throw new NotFoundException(notFoundMessage);
        }
        if (input.status === 'ACTIVE' && scopedBusiness.status === PrismaSalonOwnerStatus.INACTIVE) {
          throw new ConflictException(inactiveBusinessMessage);
        }

        const updated = await tx.salonBranch.update({
          where: { id: branchId },
          data: this.normalizeBranchUpdateInput(input, input.businessId),
        });
        if (input.timezone !== current.timezone) {
          await tx.salonBranchHours.updateMany({
            where: { branchId },
            data: { timezone: input.timezone },
          });
        }
        await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.update');
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return this.mapBranch(branch);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateBranchMessage);
      }
      throw error;
    }
  }

  async replaceBranchHours(context: SalonOwnerRequestContext, branchId: string, input: WeeklyHoursInputDto): Promise<BranchHoursModel> {
    const days = normalizeWeeklyDays(input);
    const tenantIds = this.requireTenantIds(context);
    await this.prisma.$transaction(async (tx: TransactionClient) => {
      const branch = await tx.salonBranch.findFirst({
        where: {
          id: branchId,
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
      await this.createAuditEvent(tx, context, branch.business.tenantId, 'salon_owner.branch.hours.replace');
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

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
      await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.holiday.set');
      return upserted;
    });

    return this.mapHoliday(holiday);
  }

  async updateBranchPolicy(context: SalonOwnerRequestContext, branchId: string, input: BranchPolicyInputDto): Promise<BranchPolicyModel> {
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
      await this.createAuditEvent(tx, context, business.tenantId, 'salon_owner.branch.policy.update');
      return upserted;
    });

    return this.mapPolicy(policy);
  }

  private requireTenantIds(context: SalonOwnerRequestContext): string[] {
    if (typeof context.user.tenantId === 'string' && context.user.tenantId.trim().length > 0) {
      return [context.user.tenantId];
    }

    if (hasRole(context.user, UserRole.ADMIN)) {
      const managedTenantIds = readManagedTenantIds(context.user);
      if (managedTenantIds.length > 0) {
        return [...new Set(managedTenantIds)];
      }
    }

    throw new ForbiddenException(forbiddenMessage);
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    const tenantIds = this.requireTenantIds(context);
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
    const tenantIds = this.requireTenantIds(context);
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
    const tenantIds = this.requireTenantIds(context);
    const branch = await this.prisma.salonBranch.findFirst({
      where: {
        id: branchId,
        business: { tenantId: this.tenantScopeFilter(tenantIds) },
      },
    });

    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }

    return branch;
  }

  private normalizeBranchCreateInput(input: BranchProfileInputDto, businessId: string): Prisma.SalonBranchUncheckedCreateInput {
    assertTimezone(input.timezone);
    const currency = input.currency.toUpperCase();
    assertCurrency(currency);

    return {
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
    const { phone: _phone, email: _email, ...data } = this.normalizeBranchCreateInput(input, businessId) as BranchMutationData;

    return {
      ...data,
      ...(phoneProvided ? { phone: optionalTrimOrNull(input.phone) } : {}),
      ...(emailProvided ? { email: optionalTrimOrNull(input.email) } : {}),
    };
  }

  private async createAuditEvent(
    tx: TransactionClient,
    context: SalonOwnerRequestContext,
    tenantId: string,
    action: string,
  ): Promise<void> {
    await tx.auditEvent.create({
      data: {
        userId: context.user.id,
        tenantId,
        action,
        result: 'success',
        correlationId: CorrelationId.get() ?? null,
      },
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

  private page<T>(items: readonly T[]): PagedResult<T> {
    return {
      items,
      page: {
        limit: Math.max(items.length, 1),
        nextCursor: null,
        hasMore: false,
      },
    };
  }
}
