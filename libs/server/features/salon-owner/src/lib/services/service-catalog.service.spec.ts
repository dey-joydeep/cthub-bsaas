/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser, UserRole } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { ServiceCatalogService } from './service-catalog.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'owner@example.com',
    roles: [UserRole.OWNER],
    tenantId: 'tenant-1',
    ...overrides,
  };
}

function business(overrides: Record<string, unknown> = {}) {
  return {
    id: 'business-1',
    tenantId: 'tenant-1',
    displayName: 'Salon One',
    legalName: 'Salon One Legal',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function branch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main Branch',
    phone: '1234567890',
    email: 'branch@example.com',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    address: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function category(overrides: Record<string, unknown> = {}) {
  return {
    id: 'category-1',
    businessId: 'business-1',
    name: 'Hair',
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function serviceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'service-1',
    businessId: 'business-1',
    categoryId: 'category-1',
    name: 'Cut',
    durationMinutes: 45,
    bufferMinutes: 5,
    basePrice: new Prisma.Decimal('35.00'),
    taxRatePercent: new Prisma.Decimal('10.00'),
    status: 'ACTIVE',
    skills: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function branchOverrideRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'override-1',
    serviceId: 'service-1',
    branchId: 'branch-1',
    priceOverride: new Prisma.Decimal('40.00'),
    durationOverrideMinutes: 50,
    visibleOnline: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function prismaKnownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('known request error', {
    code,
    clientVersion: '5.0.0',
  });
}

function createPrismaMock() {
  const transactionMock = jest.fn();
  const prisma = {
    salonBusiness: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    salonBranch: {
      findFirst: jest.fn(),
    },
    salonOwnerServiceCategory: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    salonOwnerService: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    salonOwnerStaff: {
      findMany: jest.fn(),
    },
    salonOwnerStaffSkill: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    salonOwnerBranchServiceOverride: {
      upsert: jest.fn(),
    },
    $transaction: transactionMock,
  };
  transactionMock.mockImplementation((callback: (tx: any) => Promise<unknown>) => callback(prisma));
  return prisma;
}

describe('ServiceCatalogService', () => {
  let service: ServiceCatalogService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation((callback: (tx: any) => Promise<unknown>) => callback(prisma));
    service = new ServiceCatalogService(prisma as unknown as PrismaService);
  });

  describe('Business & Tenant Resolution', () => {
    it('throws ForbiddenException when user has no tenantId', async () => {
      const u = user({ tenantId: undefined });
      await expect(service.listServiceCategories({ user: u })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when requested business is not found under tenant', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(null);
      await expect(service.listServiceCategories({ user: user() }, 'non-existent')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when no business is requested and count != 1', async () => {
      prisma.salonBusiness.findMany.mockResolvedValue([business(), business({ id: 'business-2' })]);
      await expect(service.listServiceCategories({ user: user() })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('uses single tenant business when businessId is omitted', async () => {
      prisma.salonBusiness.findMany.mockResolvedValue([business()]);
      prisma.salonOwnerServiceCategory.findMany.mockResolvedValue([category()]);

      const result = await service.listServiceCategories({ user: user() });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('category-1');
    });
  });

  describe('Service Categories', () => {
    it('lists service categories sorted by sortOrder and name', async () => {
      prisma.salonBusiness.findMany.mockResolvedValue([business()]);
      prisma.salonOwnerServiceCategory.findMany.mockResolvedValue([category(), category({ id: 'category-2', name: 'Color' })]);

      const result = await service.listServiceCategories({ user: user() });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Hair');
    });

    it('creates a service category with trimmed name', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.create.mockResolvedValue(category({ name: 'Hair Care' }));

      const result = await service.createServiceCategory(
        { user: user() },
        { businessId: 'business-1', name: '  Hair Care  ', sortOrder: 2 },
      );
      expect(result.name).toBe('Hair Care');
      expect(prisma.salonOwnerServiceCategory.create).toHaveBeenCalledWith({
        data: { businessId: 'business-1', name: 'Hair Care', sortOrder: 2 },
      });
    });

    it('rejects category creation with empty name', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      await expect(
        service.createServiceCategory({ user: user() }, { businessId: 'business-1', name: '   ', sortOrder: 1 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('maps duplicate category name P2002 to ConflictException', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.create.mockRejectedValue(prismaKnownError('P2002'));

      await expect(
        service.createServiceCategory({ user: user() }, { businessId: 'business-1', name: 'Hair', sortOrder: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps duplicate category generic unique constraint error to ConflictException', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.create.mockRejectedValue(new Error('A unique constraint was violated'));

      await expect(
        service.createServiceCategory({ user: user() }, { businessId: 'business-1', name: 'Hair', sortOrder: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected error on category creation', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.create.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.createServiceCategory({ user: user() }, { businessId: 'business-1', name: 'Hair', sortOrder: 1 }),
      ).rejects.toThrow('DB failure');
    });
  });

  describe('Services Master Data', () => {
    it('lists services with and without category filter', async () => {
      prisma.salonBusiness.findMany.mockResolvedValue([business()]);
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.findMany.mockResolvedValue([serviceRecord()]);

      const resultWithCat = await service.listServices({ user: user() }, { categoryId: 'category-1' });
      expect(resultWithCat.items).toHaveLength(1);
      expect(resultWithCat.items[0].id).toBe('service-1');
      expect(resultWithCat.items[0].basePrice).toBe('35.00');

      const resultWithoutCat = await service.listServices({ user: user() });
      expect(resultWithoutCat.items).toHaveLength(1);
    });

    it('creates a service with integer string prices (no decimal dot)', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.create.mockResolvedValue(serviceRecord({ basePrice: new Prisma.Decimal('35') }));

      const result = await service.createService(
        { user: user() },
        {
          businessId: 'business-1',
          categoryId: 'category-1',
          name: 'Flat Price Cut',
          durationMinutes: 30,
          basePrice: '35',
          taxRatePercent: '10',
          status: 'ACTIVE',
        },
      );

      expect(result.id).toBe('service-1');
    });

    it('throws NotFoundException when category is not found in business during listServices', async () => {
      prisma.salonBusiness.findMany.mockResolvedValue([business()]);
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(null);

      await expect(service.listServices({ user: user() }, { categoryId: 'missing-cat' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a service with valid decimal values and buffer minutes', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.create.mockResolvedValue(serviceRecord({ name: 'Special Cut', bufferMinutes: 10 }));

      const result = await service.createService(
        { user: user() },
        {
          businessId: 'business-1',
          categoryId: 'category-1',
          name: '  Special Cut  ',
          durationMinutes: 60,
          bufferMinutes: 10,
          basePrice: '50.00',
          taxRatePercent: '10.00',
          status: 'ACTIVE',
        },
      );

      expect(result.name).toBe('Special Cut');
      expect(prisma.salonOwnerService.create).toHaveBeenCalledWith({
        data: {
          businessId: 'business-1',
          categoryId: 'category-1',
          name: 'Special Cut',
          durationMinutes: 60,
          bufferMinutes: 10,
          basePrice: new Prisma.Decimal('50.00'),
          taxRatePercent: new Prisma.Decimal('10.00'),
          status: 'ACTIVE',
        },
        include: { skills: true },
      });
    });

    it('defaults bufferMinutes to 0 when omitted in createService', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.create.mockResolvedValue(serviceRecord({ bufferMinutes: 0 }));

      await service.createService(
        { user: user() },
        {
          businessId: 'business-1',
          categoryId: 'category-1',
          name: 'Quick Cut',
          durationMinutes: 30,
          basePrice: '25.00',
          taxRatePercent: '10.00',
          status: 'ACTIVE',
        },
      );

      expect(prisma.salonOwnerService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bufferMinutes: 0 }),
        }),
      );
    });

    it('rejects invalid decimal precision in createService', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());

      // Too many integer digits (> 8)
      await expect(
        service.createService(
          { user: user() },
          {
            businessId: 'business-1',
            categoryId: 'category-1',
            name: 'Overpriced Cut',
            durationMinutes: 30,
            basePrice: '123456789.00',
            taxRatePercent: '10.00',
            status: 'ACTIVE',
          },
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);

      // Too many decimal digits (> 2)
      await expect(
        service.createService(
          { user: user() },
          {
            businessId: 'business-1',
            categoryId: 'category-1',
            name: 'Precise Cut',
            durationMinutes: 30,
            basePrice: '35.123',
            taxRatePercent: '10.00',
            status: 'ACTIVE',
          },
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('maps duplicate service name to ConflictException', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.create.mockRejectedValue(prismaKnownError('P2002'));

      await expect(
        service.createService(
          { user: user() },
          {
            businessId: 'business-1',
            categoryId: 'category-1',
            name: 'Cut',
            durationMinutes: 45,
            basePrice: '35.00',
            taxRatePercent: '10.00',
            status: 'ACTIVE',
          },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected error on service creation', async () => {
      prisma.salonBusiness.findFirst.mockResolvedValue(business());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.create.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.createService(
          { user: user() },
          {
            businessId: 'business-1',
            categoryId: 'category-1',
            name: 'Cut',
            durationMinutes: 45,
            basePrice: '35.00',
            taxRatePercent: '10.00',
            status: 'ACTIVE',
          },
        ),
      ).rejects.toThrow('DB failure');
    });

    it('gets a single service by ID in scope', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord({ skills: [{ serviceId: 'service-1', staffId: 'staff-1' }] }));

      const result = await service.getService({ user: user() }, 'service-1');
      expect(result.id).toBe('service-1');
      expect(result.name).toBe('Cut');
      expect(result.eligibleStaffIds).toEqual(['staff-1']);
    });

    it('throws NotFoundException when service is not found in scope', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(null);
      await expect(service.getService({ user: user() }, 'missing-service')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates service definition and maps duplicates', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
      prisma.salonOwnerService.update.mockResolvedValue(serviceRecord({ name: 'Updated Cut', bufferMinutes: 0 }));

      const result = await service.updateService({ user: user() }, 'service-1', {
        categoryId: 'category-1',
        name: 'Updated Cut',
        durationMinutes: 50,
        basePrice: '40.00',
        taxRatePercent: '10.00',
        status: 'ACTIVE',
      });
      expect(result.name).toBe('Updated Cut');

      prisma.salonOwnerService.update.mockRejectedValueOnce(prismaKnownError('P2002'));
      await expect(
        service.updateService({ user: user() }, 'service-1', {
          categoryId: 'category-1',
          name: 'Duplicate Cut',
          durationMinutes: 50,
          basePrice: '40.00',
          taxRatePercent: '10.00',
          status: 'ACTIVE',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      prisma.salonOwnerService.update.mockRejectedValueOnce(new Error('DB update failure'));
      await expect(
        service.updateService({ user: user() }, 'service-1', {
          categoryId: 'category-1',
          name: 'Crash Cut',
          durationMinutes: 50,
          basePrice: '40.00',
          taxRatePercent: '10.00',
          status: 'ACTIVE',
        }),
      ).rejects.toThrow('DB update failure');
    });

    it('updates service status', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonOwnerService.update.mockResolvedValue(serviceRecord({ status: 'INACTIVE' }));

      const result = await service.updateServiceStatus({ user: user() }, 'service-1', { status: 'INACTIVE' });
      expect(result.status).toBe('INACTIVE');
    });
  });

  describe('Service Staff Eligibility', () => {
    it('replaces service staff eligibility with valid staff IDs', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonOwnerStaff.findMany.mockResolvedValue([{ id: 'staff-1' }, { id: 'staff-2' }]);

      const result = await service.replaceServiceStaffEligibility({ user: user() }, 'service-1', {
        staffIds: ['staff-1', 'staff-2', 'staff-1'],
      });

      expect(result.success).toBe(true);
      expect(prisma.salonOwnerStaffSkill.deleteMany).toHaveBeenCalledWith({ where: { serviceId: 'service-1' } });
      expect(prisma.salonOwnerStaffSkill.createMany).toHaveBeenCalledWith({
        data: [
          { serviceId: 'service-1', staffId: 'staff-1' },
          { serviceId: 'service-1', staffId: 'staff-2' },
        ],
      });
    });

    it('clears service staff eligibility when staffIds is empty', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());

      const result = await service.replaceServiceStaffEligibility({ user: user() }, 'service-1', { staffIds: [] });
      expect(result.success).toBe(true);
      expect(prisma.salonOwnerStaffSkill.deleteMany).toHaveBeenCalledWith({ where: { serviceId: 'service-1' } });
      expect(prisma.salonOwnerStaffSkill.createMany).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when any staffId does not belong to the business', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonOwnerStaff.findMany.mockResolvedValue([{ id: 'staff-1' }]);

      await expect(
        service.replaceServiceStaffEligibility({ user: user() }, 'service-1', { staffIds: ['staff-1', 'staff-foreign'] }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('Branch Service Override (ADR-0004 & Delegated Management)', () => {
    it('allows OWNER to set branch service override', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch());
      prisma.salonOwnerBranchServiceOverride.upsert.mockResolvedValue(branchOverrideRecord());

      const result = await service.updateBranchServiceOverride({ user: user({ roles: [UserRole.OWNER] }) }, 'service-1', 'branch-1', {
        priceOverride: '40.00',
        durationOverrideMinutes: 50,
        visibleOnline: true,
        isActive: true,
      });

      expect(result.serviceId).toBe('service-1');
      expect(result.branchId).toBe('branch-1');
      expect(result.priceOverride).toBe('40.00');
      expect(result.durationOverrideMinutes).toBe(50);
    });

    it('allows branch manager to set override for branch in their managedBranchIds', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch({ id: 'branch-1' }));
      prisma.salonOwnerBranchServiceOverride.upsert.mockResolvedValue(branchOverrideRecord());

      const managerUser = user({
        roles: [{ id: 1, name: 'MANAGER' }],
        managedBranchIds: ['branch-1', 'branch-2'],
      });

      const result = await service.updateBranchServiceOverride({ user: managerUser }, 'service-1', 'branch-1', { priceOverride: '42.00' });

      expect(result.id).toBe('override-1');
    });

    it('allows manager with object role shape or canManageBranches flag', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch({ id: 'branch-1' }));
      prisma.salonOwnerBranchServiceOverride.upsert.mockResolvedValue(branchOverrideRecord());

      const managerUser = user({
        roles: [{ name: 'BRANCH_MANAGER' } as any],
        managedBranchIds: ['branch-1'],
      });

      await expect(service.updateBranchServiceOverride({ user: managerUser }, 'service-1', 'branch-1', {})).resolves.toBeDefined();

      const canManageUser = user({
        roles: [],
        canManageBranches: true,
        managedBranchIds: ['branch-1'],
      });

      await expect(service.updateBranchServiceOverride({ user: canManageUser }, 'service-1', 'branch-1', {})).resolves.toBeDefined();
    });

    it('rejects branch manager when branch is outside their managedBranchIds', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch({ id: 'branch-3' }));

      const managerUser = user({
        roles: [{ id: 1, name: 'MANAGER' }],
        managedBranchIds: ['branch-1', 'branch-2'],
      });

      await expect(
        service.updateBranchServiceOverride({ user: managerUser }, 'service-1', 'branch-3', { priceOverride: '42.00' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects non-manager staff without branch management rights', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch());

      const stylistUser = user({
        roles: [{ id: 2, name: 'STYLIST' }],
        managedBranchIds: ['branch-1'],
      });

      await expect(
        service.updateBranchServiceOverride({ user: stylistUser }, 'service-1', 'branch-1', { priceOverride: '42.00' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const noRolesUser = user({
        roles: undefined,
        managedBranchIds: ['branch-1'],
      });

      await expect(
        service.updateBranchServiceOverride({ user: noRolesUser }, 'service-1', 'branch-1', { priceOverride: '42.00' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const unnamedRoleUser = user({
        roles: [{ name: undefined } as any],
        managedBranchIds: ['branch-1'],
      });

      await expect(
        service.updateBranchServiceOverride({ user: unnamedRoleUser }, 'service-1', 'branch-1', { priceOverride: '42.00' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects override when branch belongs to different business than service', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord({ businessId: 'business-1' }));
      prisma.salonBranch.findFirst.mockResolvedValue(branch({ id: 'branch-1', businessId: 'business-foreign' }));

      await expect(
        service.updateBranchServiceOverride({ user: user() }, 'service-1', 'branch-1', { priceOverride: '40.00' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFoundException when branch is not found in scope', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(null);

      await expect(service.updateBranchServiceOverride({ user: user() }, 'service-1', 'missing-branch', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('supports null priceOverride and partial updates in upsert', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch());
      prisma.salonOwnerBranchServiceOverride.upsert.mockResolvedValue(
        branchOverrideRecord({ priceOverride: null, durationOverrideMinutes: null }),
      );

      const result = await service.updateBranchServiceOverride({ user: user() }, 'service-1', 'branch-1', {
        priceOverride: null,
        durationOverrideMinutes: null,
        visibleOnline: false,
        isActive: false,
      });

      expect(result.priceOverride).toBeNull();
      expect(prisma.salonOwnerBranchServiceOverride.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            priceOverride: null,
            durationOverrideMinutes: null,
            visibleOnline: false,
            isActive: false,
          }),
        }),
      );
    });

    it('rejects invalid decimal precision on priceOverride', async () => {
      prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
      prisma.salonBranch.findFirst.mockResolvedValue(branch());

      await expect(
        service.updateBranchServiceOverride({ user: user() }, 'service-1', 'branch-1', { priceOverride: '123456789.00' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });
});
