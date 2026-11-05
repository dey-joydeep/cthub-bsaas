import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import {
  ServiceCategoryInputDto,
  ServiceInputDto,
  ServiceStatusInputDto,
  StaffEligibilityInputDto,
  StaffInputDto,
  StaffLeaveBlockInputDto,
  StaffLeaveBlockQueryDto,
  StaffListQueryDto,
  StaffRolesInputDto,
  StaffShiftDayDto,
  StaffShiftInputDto,
  StaffSkillsInputDto,
} from '../dto/staff-service-catalog.dto';
import { PagedResult, SalonOwnerRequestContext, TimeIntervalModel } from '../models/salon-owner-settings.models';
import {
  ServiceCategoryModel,
  ServiceModel,
  StaffLeaveBlockModel,
  StaffModel,
  StaffShiftDayModel,
  StaffShiftModel,
  SuccessResult,
} from '../models/staff-service-catalog.models';

const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const duplicateStaffMessage = 'error.staff.profile.duplicate';
const duplicateCategoryMessage = 'error.service.category.duplicate';
const duplicateServiceMessage = 'error.service.duplicate';
const finalOwnerConflictMessage = 'error.staff.owner.final_required';

const staffInclude = {
  branches: true,
  skills: true,
} as const;
const serviceInclude = {
  skills: true,
} as const;

type BusinessRecord = Awaited<ReturnType<PrismaService['salonBusiness']['findFirst']>>;
type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type StaffRecord = Prisma.SalonOwnerStaffGetPayload<{ include: typeof staffInclude }>;
type ServiceRecord = Prisma.SalonOwnerServiceGetPayload<{ include: typeof serviceInclude }>;
type ServiceCategoryRecord = Awaited<ReturnType<PrismaService['salonOwnerServiceCategory']['create']>>;
type StaffLeaveBlockRecord = Awaited<ReturnType<PrismaService['salonOwnerStaffLeaveBlock']['create']>>;
interface ServiceListOptions {
  categoryId?: string;
  businessId?: string;
}

function trimRequired(value: string, minimumLength = 1): string {
  const trimmed = value.trim();
  if (trimmed.length < minimumLength) {
    throw new UnprocessableEntityException(validationMessage);
  }
  return trimmed;
}

function optionalTrim(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
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

function assertTimezone(value: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
  } catch {
    throw new UnprocessableEntityException(validationMessage);
  }
}

function normalizeShiftDays(days: readonly StaffShiftDayDto[]): StaffShiftDayModel[] {
  const seen = new Set<number>();
  const normalized = days.map((day) => {
    if (seen.has(day.dayOfWeek)) {
      throw new UnprocessableEntityException(validationMessage);
    }
    seen.add(day.dayOfWeek);
    const intervals = day.intervals.map((interval) => ({ start: interval.start, end: interval.end }));
    assertIntervals(intervals);
    return { dayOfWeek: day.dayOfWeek, intervals };
  });

  return normalized.sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

function toJsonShiftDays(days: readonly StaffShiftDayModel[]): Prisma.InputJsonValue {
  return days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    intervals: day.intervals.map((interval) => ({ start: interval.start, end: interval.end })),
  }));
}

function isDuplicate(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002';
  }
  return error instanceof Error && error.message === 'A unique constraint was violated';
}

function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function assertDecimalPrecision(value: string, maxIntegerDigits: number): void {
  const [integerPart = '', decimalPart = ''] = value.split('.');
  if (integerPart.length > maxIntegerDigits || decimalPart.length > 2) {
    throw new UnprocessableEntityException(validationMessage);
  }
}

@Injectable()
export class StaffServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listStaff(context: SalonOwnerRequestContext, options: StaffListQueryDto = {}): Promise<PagedResult<StaffModel>> {
    const tenantId = this.requireTenantId(context);
    const { branchId, businessId } = options;
    if (businessId) {
      await this.resolveBusinessInScope(context, businessId);
    }
    if (branchId) {
      await this.findBranchInScope(context, branchId);
    }

    const query = optionalTrim(options.q);
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const where: Prisma.SalonOwnerStaffWhereInput = {
      business: { tenantId, ...(businessId ? { id: businessId } : {}) },
      ...(branchId ? { branches: { some: { branchId } } } : {}),
      ...(query
        ? {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const total = await this.prisma.salonOwnerStaff.count({ where });
    const staff = await this.prisma.salonOwnerStaff.findMany({
      where,
      include: staffInclude,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return this.page(
      staff.map((member) => this.mapStaff(member)),
      { page, pageSize, total },
    );
  }

  async createStaff(context: SalonOwnerRequestContext, input: StaffInputDto): Promise<StaffModel> {
    const branches = await this.findBranchesInScope(context, input.branchIds);
    const businessId = this.requireSingleBusiness(branches);

    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        const created = await tx.salonOwnerStaff.create({
          data: {
            businessId,
            displayName: trimRequired(input.displayName, 2),
            phone: trimRequired(input.phone),
            email: optionalTrim(input.email),
            status: input.status,
          },
        });
        await tx.salonOwnerStaffBranch.createMany({
          data: unique(input.branchIds).map((branchId) => ({ staffId: created.id, branchId })),
        });
        return tx.salonOwnerStaff.findUniqueOrThrow({ where: { id: created.id }, include: staffInclude });
      });
      return this.mapStaff(staff);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateStaffMessage);
      }
      throw error;
    }
  }

  async getStaff(context: SalonOwnerRequestContext, staffId: string): Promise<StaffModel> {
    return this.mapStaff(await this.findStaffInScope(context, staffId));
  }

  async updateStaff(context: SalonOwnerRequestContext, staffId: string, input: StaffInputDto): Promise<StaffModel> {
    const current = await this.findStaffInScope(context, staffId);
    const branches = await this.findBranchesInScope(context, input.branchIds);
    const businessId = this.requireSingleBusiness(branches);
    if (businessId !== current.businessId) {
      throw new ForbiddenException(forbiddenMessage);
    }

    if (current.roles.includes('OWNER') && current.status === 'ACTIVE' && input.status === 'INACTIVE') {
      const remainingOwnerCount = await this.prisma.salonOwnerStaff.count({
        where: {
          businessId: current.businessId,
          status: 'ACTIVE',
          roles: { has: 'OWNER' },
        },
      });
      if (remainingOwnerCount <= 1) {
        throw new ConflictException(finalOwnerConflictMessage);
      }
    }

    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        await tx.salonOwnerStaff.update({
          where: { id: staffId },
          data: {
            displayName: trimRequired(input.displayName, 2),
            phone: trimRequired(input.phone),
            email: optionalTrim(input.email),
            status: input.status,
          },
        });
        await tx.salonOwnerStaffBranch.deleteMany({ where: { staffId } });
        await tx.salonOwnerStaffBranch.createMany({
          data: unique(input.branchIds).map((branchId) => ({ staffId, branchId })),
        });
        return tx.salonOwnerStaff.findUniqueOrThrow({ where: { id: staffId }, include: staffInclude });
      });
      return this.mapStaff(staff);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateStaffMessage);
      }
      throw error;
    }
  }

  async replaceStaffRoles(context: SalonOwnerRequestContext, staffId: string, input: StaffRolesInputDto): Promise<StaffModel> {
    const current = await this.findStaffInScope(context, staffId);
    const updatedRoles = unique(input.roles);

    if (current.roles.includes('OWNER') && !updatedRoles.includes('OWNER')) {
      const remainingOwnerCount = await this.prisma.salonOwnerStaff.count({
        where: {
          businessId: current.businessId,
          status: 'ACTIVE',
          roles: { has: 'OWNER' },
        },
      });
      if (remainingOwnerCount <= 1) {
        throw new ConflictException(finalOwnerConflictMessage);
      }
    }

    const staff = await this.prisma.salonOwnerStaff.update({
      where: { id: staffId },
      data: { roles: updatedRoles },
      include: staffInclude,
    });
    return this.mapStaff(staff);
  }

  async replaceStaffSkills(context: SalonOwnerRequestContext, staffId: string, input: StaffSkillsInputDto): Promise<StaffModel> {
    const staff = await this.findStaffInScope(context, staffId);
    await this.assertServicesInBusiness(staff.businessId, input.serviceIds);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerStaffSkill.deleteMany({ where: { staffId } });
      const serviceIds = unique(input.serviceIds);
      if (serviceIds.length > 0) {
        await tx.salonOwnerStaffSkill.createMany({
          data: serviceIds.map((serviceId) => ({ staffId, serviceId })),
        });
      }
      return tx.salonOwnerStaff.findUniqueOrThrow({ where: { id: staffId }, include: staffInclude });
    });

    return this.mapStaff(updated);
  }

  async replaceStaffShifts(context: SalonOwnerRequestContext, staffId: string, input: StaffShiftInputDto): Promise<StaffShiftModel> {
    assertTimezone(input.timezone);
    const staff = await this.findStaffInScope(context, staffId);
    const branch = await this.findBranchInScope(context, input.branchId);
    if (branch.businessId !== staff.businessId || !staff.branches.some((assigned) => assigned.branchId === branch.id)) {
      throw new ForbiddenException(forbiddenMessage);
    }
    if (input.timezone !== branch.timezone) {
      throw new UnprocessableEntityException(validationMessage);
    }

    const days = normalizeShiftDays(input.days);
    const shift = await this.prisma.salonOwnerStaffShift.upsert({
      where: { staffId_branchId: { staffId, branchId: branch.id } },
      create: { staffId, branchId: branch.id, timezone: input.timezone, days: toJsonShiftDays(days) },
      update: { timezone: input.timezone, days: toJsonShiftDays(days) },
    });

    return { staffId, branchId: shift.branchId, timezone: shift.timezone, days };
  }

  async listStaffLeaveBlocks(
    context: SalonOwnerRequestContext,
    staffId: string,
    query: StaffLeaveBlockQueryDto = {},
  ): Promise<PagedResult<StaffLeaveBlockModel>> {
    await this.findStaffInScope(context, staffId);

    const fromDate = query.from ? new Date(query.from) : undefined;
    const toDate = query.to ? new Date(query.to) : undefined;

    if (fromDate && Number.isNaN(fromDate.getTime())) {
      throw new UnprocessableEntityException(validationMessage);
    }
    if (toDate && Number.isNaN(toDate.getTime())) {
      throw new UnprocessableEntityException(validationMessage);
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new UnprocessableEntityException(validationMessage);
    }

    const where: Prisma.SalonOwnerStaffLeaveBlockWhereInput = {
      staffId,
      ...(fromDate ? { endsAt: { gte: fromDate } } : {}),
      ...(toDate ? { startsAt: { lte: toDate } } : {}),
    };

    const blocks = await this.prisma.salonOwnerStaffLeaveBlock.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });

    return this.page(blocks.map((block) => this.mapLeaveBlock(block)));
  }

  async createStaffLeaveBlock(
    context: SalonOwnerRequestContext,
    staffId: string,
    input: StaffLeaveBlockInputDto,
  ): Promise<StaffLeaveBlockModel> {
    const staff = await this.findStaffInScope(context, staffId);
    let branchId: string | null = null;
    if (input.branchId) {
      const branch = await this.findBranchInScope(context, input.branchId);
      if (branch.businessId !== staff.businessId || !staff.branches.some((assigned) => assigned.branchId === branch.id)) {
        throw new ForbiddenException(forbiddenMessage);
      }
      branchId = branch.id;
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || !(startsAt < endsAt)) {
      throw new UnprocessableEntityException(validationMessage);
    }

    return this.mapLeaveBlock(
      await this.prisma.salonOwnerStaffLeaveBlock.create({
        data: { staffId, branchId, startsAt, endsAt, reason: trimRequired(input.reason) },
      }),
    );
  }

  async deleteStaffLeaveBlock(context: SalonOwnerRequestContext, staffId: string, leaveBlockId: string): Promise<SuccessResult> {
    const staff = await this.findStaffInScope(context, staffId);

    const block = await this.prisma.salonOwnerStaffLeaveBlock.findFirst({
      where: { id: leaveBlockId, staffId: staff.id },
    });
    if (!block) {
      throw new NotFoundException(notFoundMessage);
    }

    await this.prisma.salonOwnerStaffLeaveBlock.delete({
      where: { id: leaveBlockId },
    });

    return { success: true };
  }

  async listServiceCategories(context: SalonOwnerRequestContext, businessId?: string): Promise<PagedResult<ServiceCategoryModel>> {
    const business = await this.resolveBusinessInScope(context, businessId);
    const categories = await this.prisma.salonOwnerServiceCategory.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return this.page(categories.map((category) => this.mapCategory(category)));
  }

  async createServiceCategory(context: SalonOwnerRequestContext, input: ServiceCategoryInputDto): Promise<ServiceCategoryModel> {
    const business = await this.resolveBusinessInScope(context, input.businessId);
    try {
      return this.mapCategory(
        await this.prisma.salonOwnerServiceCategory.create({
          data: { businessId: business.id, name: trimRequired(input.name), sortOrder: input.sortOrder },
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateCategoryMessage);
      }
      throw error;
    }
  }

  async listServices(context: SalonOwnerRequestContext, options: ServiceListOptions = {}): Promise<PagedResult<ServiceModel>> {
    const { categoryId, businessId } = options;
    const business = await this.resolveBusinessInScope(context, businessId);
    if (categoryId) {
      await this.findCategoryInBusiness(business.id, categoryId);
    }

    const services = await this.prisma.salonOwnerService.findMany({
      where: { businessId: business.id, ...(categoryId ? { categoryId } : {}) },
      include: serviceInclude,
      orderBy: { createdAt: 'asc' },
    });
    return this.page(services.map((service) => this.mapService(service)));
  }

  async createService(context: SalonOwnerRequestContext, input: ServiceInputDto): Promise<ServiceModel> {
    const business = await this.resolveBusinessInScope(context, input.businessId);
    await this.findCategoryInBusiness(business.id, input.categoryId);

    try {
      return this.mapService(
        await this.prisma.salonOwnerService.create({
          data: this.normalizeServiceInput(business.id, input),
          include: serviceInclude,
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateServiceMessage);
      }
      throw error;
    }
  }

  async getService(context: SalonOwnerRequestContext, serviceId: string): Promise<ServiceModel> {
    return this.mapService(await this.findServiceInScope(context, serviceId));
  }

  async updateService(context: SalonOwnerRequestContext, serviceId: string, input: ServiceInputDto): Promise<ServiceModel> {
    const current = await this.findServiceInScope(context, serviceId);
    if (input.businessId && input.businessId !== current.businessId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    await this.findCategoryInBusiness(current.businessId, input.categoryId);

    try {
      return this.mapService(
        await this.prisma.salonOwnerService.update({
          where: { id: serviceId },
          data: this.normalizeServiceInput(current.businessId, input),
          include: serviceInclude,
        }),
      );
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateServiceMessage);
      }
      throw error;
    }
  }

  async updateServiceStatus(context: SalonOwnerRequestContext, serviceId: string, input: ServiceStatusInputDto): Promise<ServiceModel> {
    await this.findServiceInScope(context, serviceId);
    return this.mapService(
      await this.prisma.salonOwnerService.update({
        where: { id: serviceId },
        data: { status: input.status },
        include: serviceInclude,
      }),
    );
  }

  async replaceServiceStaffEligibility(
    context: SalonOwnerRequestContext,
    serviceId: string,
    input: StaffEligibilityInputDto,
  ): Promise<ServiceModel> {
    const service = await this.findServiceInScope(context, serviceId);
    await this.assertStaffInBusiness(service.businessId, input.staffIds);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerStaffSkill.deleteMany({ where: { serviceId } });
      const staffIds = unique(input.staffIds);
      if (staffIds.length > 0) {
        await tx.salonOwnerStaffSkill.createMany({
          data: staffIds.map((staffId) => ({ serviceId, staffId })),
        });
      }
      return tx.salonOwnerService.findUniqueOrThrow({ where: { id: serviceId }, include: serviceInclude });
    });

    return this.mapService(updated);
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async resolveBusinessInScope(context: SalonOwnerRequestContext, businessId?: string): Promise<NonNullable<BusinessRecord>> {
    const tenantId = this.requireTenantId(context);
    if (businessId) {
      const business = await this.prisma.salonBusiness.findFirst({ where: { id: businessId, tenantId } });
      if (!business) {
        throw new NotFoundException(notFoundMessage);
      }
      return business;
    }

    const businesses = await this.prisma.salonBusiness.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });
    if (businesses.length === 0) {
      throw new NotFoundException(notFoundMessage);
    }
    if (businesses.length > 1) {
      throw new UnprocessableEntityException(validationMessage);
    }
    return businesses[0];
  }

  private async findBranchInScope(context: SalonOwnerRequestContext, branchId: string): Promise<BranchRecord> {
    const tenantId = this.requireTenantId(context);
    const branch = await this.prisma.salonBranch.findFirst({
      where: { id: branchId, business: { tenantId } },
    });
    if (!branch) {
      throw new NotFoundException(notFoundMessage);
    }
    return branch;
  }

  private async findBranchesInScope(context: SalonOwnerRequestContext, branchIds: readonly string[]): Promise<BranchRecord[]> {
    const ids = unique(branchIds);
    if (ids.length === 0) {
      throw new UnprocessableEntityException(validationMessage);
    }
    const tenantId = this.requireTenantId(context);
    const branches = await this.prisma.salonBranch.findMany({
      where: { id: { in: ids }, business: { tenantId } },
    });
    if (branches.length !== ids.length) {
      throw new NotFoundException(notFoundMessage);
    }
    return branches;
  }

  private async findStaffInScope(context: SalonOwnerRequestContext, staffId: string): Promise<StaffRecord> {
    const tenantId = this.requireTenantId(context);
    const staff = await this.prisma.salonOwnerStaff.findFirst({
      where: { id: staffId, business: { tenantId } },
      include: staffInclude,
    });
    if (!staff) {
      throw new NotFoundException(notFoundMessage);
    }
    return staff;
  }

  private async findCategoryInBusiness(businessId: string, categoryId: string): Promise<ServiceCategoryRecord> {
    const category = await this.prisma.salonOwnerServiceCategory.findFirst({ where: { id: categoryId, businessId } });
    if (!category) {
      throw new NotFoundException(notFoundMessage);
    }
    return category;
  }

  private async findServiceInScope(context: SalonOwnerRequestContext, serviceId: string): Promise<ServiceRecord> {
    const tenantId = this.requireTenantId(context);
    const service = await this.prisma.salonOwnerService.findFirst({
      where: { id: serviceId, business: { tenantId } },
      include: serviceInclude,
    });
    if (!service) {
      throw new NotFoundException(notFoundMessage);
    }
    return service;
  }

  private requireSingleBusiness(branches: readonly BranchRecord[]): string {
    const businessIds = unique(branches.map((branch) => branch.businessId));
    if (businessIds.length !== 1) {
      throw new UnprocessableEntityException(validationMessage);
    }
    return businessIds[0];
  }

  private async assertServicesInBusiness(businessId: string, serviceIds: readonly string[]): Promise<void> {
    const ids = unique(serviceIds);
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.salonOwnerService.count({ where: { id: { in: ids }, businessId } });
    if (count !== ids.length) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private async assertStaffInBusiness(businessId: string, staffIds: readonly string[]): Promise<void> {
    const ids = unique(staffIds);
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.salonOwnerStaff.count({ where: { id: { in: ids }, businessId } });
    if (count !== ids.length) {
      throw new NotFoundException(notFoundMessage);
    }
  }

  private normalizeServiceInput(businessId: string, input: ServiceInputDto): Prisma.SalonOwnerServiceUncheckedCreateInput {
    assertDecimalPrecision(input.basePrice, 8);
    assertDecimalPrecision(input.taxRatePercent, 3);
    return {
      businessId,
      categoryId: input.categoryId,
      name: trimRequired(input.name),
      durationMinutes: input.durationMinutes,
      bufferMinutes: input.bufferMinutes ?? 0,
      basePrice: new Prisma.Decimal(input.basePrice),
      taxRatePercent: new Prisma.Decimal(input.taxRatePercent),
      status: input.status,
    };
  }

  private mapStaff(staff: StaffRecord): StaffModel {
    return {
      id: staff.id,
      branchIds: staff.branches.map((branch) => branch.branchId).sort(),
      displayName: staff.displayName,
      phone: staff.phone,
      ...(staff.email ? { email: staff.email } : {}),
      status: staff.status,
      roles: staff.roles,
      skillServiceIds: staff.skills.map((skill) => skill.serviceId).sort(),
      createdAt: toIso(staff.createdAt),
      updatedAt: toIso(staff.updatedAt),
    };
  }

  private mapLeaveBlock(block: StaffLeaveBlockRecord): StaffLeaveBlockModel {
    return {
      id: block.id,
      staffId: block.staffId,
      branchId: block.branchId,
      startsAt: toIso(block.startsAt),
      endsAt: toIso(block.endsAt),
      reason: block.reason,
    };
  }

  private mapCategory(category: ServiceCategoryRecord): ServiceCategoryModel {
    return {
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
    };
  }

  private mapService(service: ServiceRecord): ServiceModel {
    return {
      id: service.id,
      categoryId: service.categoryId,
      name: service.name,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      basePrice: decimalToString(service.basePrice),
      taxRatePercent: decimalToString(service.taxRatePercent),
      status: service.status,
      eligibleStaffIds: (service.skills ?? []).map((skill) => skill.staffId).sort(),
    };
  }

  private page<T>(items: readonly T[], pagination?: { page: number; pageSize: number; total: number }): PagedResult<T> {
    return {
      items,
      page: {
        limit: pagination?.pageSize ?? items.length,
        nextCursor: null,
        hasMore: pagination ? pagination.page * pagination.pageSize < pagination.total : false,
        ...(pagination ? { page: pagination.page, pageSize: pagination.pageSize, total: pagination.total } : {}),
      },
    };
  }
}
