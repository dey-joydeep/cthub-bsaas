import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser, COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';
import { PrismaService } from '@cthub-bsaas/server-data-access';

import {
  BranchServiceOverrideInputDto,
  ServiceCategoryInputDto,
  ServiceInputDto,
  ServiceStatusInputDto,
  StaffEligibilityInputDto,
} from '../dto/staff-service-catalog.dto';
import { PagedResult, SalonOwnerRequestContext } from '../models/salon-owner-settings.models';
import { BranchServiceOverrideModel, ServiceCategoryModel, ServiceModel, SuccessResult } from '../models/staff-service-catalog.models';

const validationMessage = COMMON_MESSAGE_KEYS.ERROR.VALIDATION;
const forbiddenMessage = COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_SCOPE;
const notFoundMessage = COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND;
const duplicateCategoryMessage = 'error.service.category.duplicate';
const duplicateServiceMessage = 'error.service.duplicate';

const serviceInclude = {
  skills: true,
} as const;

type BusinessRecord = Prisma.SalonBusinessGetPayload<object>;
type BranchRecord = Awaited<ReturnType<PrismaService['salonBranch']['findFirstOrThrow']>>;
type ServiceRecord = Prisma.SalonOwnerServiceGetPayload<{ include: typeof serviceInclude }>;
type ServiceCategoryRecord = Awaited<ReturnType<PrismaService['salonOwnerServiceCategory']['create']>>;
type BranchServiceOverrideRecord = Prisma.SalonOwnerBranchServiceOverrideGetPayload<object>;

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

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
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

function extractRoleNames(user: AuthenticatedUser): string[] {
  if (!user.roles) return [];
  return (user.roles as Array<string | { name?: string }>).map((r) =>
    typeof r === 'string' ? r.toUpperCase() : (r.name ?? '').toUpperCase(),
  );
}

function isUserOwnerOrAdmin(user: AuthenticatedUser): boolean {
  const roleNames = extractRoleNames(user);
  return roleNames.includes('OWNER') || roleNames.includes('ADMIN');
}

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

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
    assertDecimalPrecision(input.basePrice, 8);
    assertDecimalPrecision(input.taxRatePercent, 3);

    try {
      const service = await this.prisma.salonOwnerService.create({
        data: {
          businessId: business.id,
          categoryId: input.categoryId,
          name: trimRequired(input.name),
          durationMinutes: input.durationMinutes,
          bufferMinutes: input.bufferMinutes ?? 0,
          basePrice: new Prisma.Decimal(input.basePrice),
          taxRatePercent: new Prisma.Decimal(input.taxRatePercent),
          status: input.status,
        },
        include: serviceInclude,
      });
      return this.mapService(service);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateServiceMessage);
      }
      throw error;
    }
  }

  async getService(context: SalonOwnerRequestContext, serviceId: string): Promise<ServiceModel> {
    const service = await this.findServiceInScope(context, serviceId);
    return this.mapService(service);
  }

  async updateService(context: SalonOwnerRequestContext, serviceId: string, input: ServiceInputDto): Promise<ServiceModel> {
    const service = await this.findServiceInScope(context, serviceId);
    await this.findCategoryInBusiness(service.businessId, input.categoryId);
    assertDecimalPrecision(input.basePrice, 8);
    assertDecimalPrecision(input.taxRatePercent, 3);

    try {
      const updated = await this.prisma.salonOwnerService.update({
        where: { id: serviceId },
        data: {
          categoryId: input.categoryId,
          name: trimRequired(input.name),
          durationMinutes: input.durationMinutes,
          bufferMinutes: input.bufferMinutes ?? 0,
          basePrice: new Prisma.Decimal(input.basePrice),
          taxRatePercent: new Prisma.Decimal(input.taxRatePercent),
          status: input.status,
        },
        include: serviceInclude,
      });
      return this.mapService(updated);
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ConflictException(duplicateServiceMessage);
      }
      throw error;
    }
  }

  async updateServiceStatus(context: SalonOwnerRequestContext, serviceId: string, input: ServiceStatusInputDto): Promise<ServiceModel> {
    await this.findServiceInScope(context, serviceId);
    const updated = await this.prisma.salonOwnerService.update({
      where: { id: serviceId },
      data: { status: input.status },
      include: serviceInclude,
    });
    return this.mapService(updated);
  }

  async replaceServiceStaffEligibility(
    context: SalonOwnerRequestContext,
    serviceId: string,
    input: StaffEligibilityInputDto,
  ): Promise<SuccessResult> {
    const service = await this.findServiceInScope(context, serviceId);
    const staffIds = unique(input.staffIds);

    if (staffIds.length > 0) {
      const staffList = await this.prisma.salonOwnerStaff.findMany({
        where: { id: { in: staffIds }, businessId: service.businessId },
        select: { id: true },
      });
      if (staffList.length !== staffIds.length) {
        throw new UnprocessableEntityException('error.service.eligibility.staff.invalid');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.salonOwnerStaffSkill.deleteMany({ where: { serviceId } });
      if (staffIds.length > 0) {
        await tx.salonOwnerStaffSkill.createMany({
          data: staffIds.map((staffId) => ({ serviceId, staffId })),
        });
      }
    });

    return { success: true };
  }

  async updateBranchServiceOverride(
    context: SalonOwnerRequestContext,
    serviceId: string,
    branchId: string,
    input: BranchServiceOverrideInputDto,
  ): Promise<BranchServiceOverrideModel> {
    const service = await this.findServiceInScope(context, serviceId);
    const branch = await this.findBranchInScope(context, branchId);

    if (branch.businessId !== service.businessId) {
      throw new ConflictException(validationMessage);
    }

    this.assertBranchManagerScope(context.user, branchId);

    if (input.priceOverride !== undefined && input.priceOverride !== null) {
      assertDecimalPrecision(input.priceOverride, 8);
    }

    const priceOverride =
      input.priceOverride !== undefined && input.priceOverride !== null ? new Prisma.Decimal(input.priceOverride) : null;

    const override = await this.prisma.salonOwnerBranchServiceOverride.upsert({
      where: {
        serviceId_branchId: { serviceId, branchId },
      },
      create: {
        serviceId,
        branchId,
        priceOverride,
        durationOverrideMinutes: input.durationOverrideMinutes ?? null,
        visibleOnline: input.visibleOnline ?? true,
        isActive: input.isActive ?? true,
      },
      update: {
        ...(input.priceOverride !== undefined ? { priceOverride } : {}),
        ...(input.durationOverrideMinutes !== undefined ? { durationOverrideMinutes: input.durationOverrideMinutes } : {}),
        ...(input.visibleOnline !== undefined ? { visibleOnline: input.visibleOnline } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    return this.mapBranchServiceOverride(override);
  }

  private assertBranchManagerScope(user: AuthenticatedUser, branchId: string): void {
    if (isUserOwnerOrAdmin(user)) {
      return;
    }
    const roleNames = extractRoleNames(user);
    const isManager = roleNames.includes('MANAGER') || roleNames.includes('BRANCH_MANAGER') || Boolean(user.canManageBranches);
    if (!isManager) {
      throw new ForbiddenException(forbiddenMessage);
    }
    if (user.managedBranchIds && user.managedBranchIds.length > 0 && !user.managedBranchIds.includes(branchId)) {
      throw new ForbiddenException(forbiddenMessage);
    }
  }

  private requireTenantId(context: SalonOwnerRequestContext): string {
    if (!context.user.tenantId) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return context.user.tenantId;
  }

  private async resolveBusinessInScope(context: SalonOwnerRequestContext, requestedBusinessId?: string): Promise<BusinessRecord> {
    const tenantId = this.requireTenantId(context);
    const effectiveBusinessId = requestedBusinessId;

    if (effectiveBusinessId) {
      const business = await this.prisma.salonBusiness.findFirst({
        where: { id: effectiveBusinessId, tenantId },
      });
      if (!business) {
        throw new NotFoundException(notFoundMessage);
      }
      return business;
    }

    const businesses = await this.prisma.salonBusiness.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    if (businesses.length !== 1) {
      throw new ForbiddenException(forbiddenMessage);
    }
    return businesses[0];
  }

  private async findCategoryInBusiness(businessId: string, categoryId: string): Promise<ServiceCategoryRecord> {
    const category = await this.prisma.salonOwnerServiceCategory.findFirst({
      where: { id: categoryId, businessId },
    });
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

  private mapBranchServiceOverride(override: BranchServiceOverrideRecord): BranchServiceOverrideModel {
    return {
      id: override.id,
      serviceId: override.serviceId,
      branchId: override.branchId,
      priceOverride: override.priceOverride ? decimalToString(override.priceOverride) : null,
      durationOverrideMinutes: override.durationOverrideMinutes,
      visibleOnline: override.visibleOnline,
      isActive: override.isActive,
      createdAt: override.createdAt.toISOString(),
      updatedAt: override.updatedAt.toISOString(),
    };
  }

  private page<T>(items: readonly T[]): PagedResult<T> {
    return {
      items,
      page: {
        limit: items.length,
        nextCursor: null,
        hasMore: false,
      },
    };
  }
}
