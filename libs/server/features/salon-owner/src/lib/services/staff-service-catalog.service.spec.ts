/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';
import type { StaffPersonalProfileModel } from '../models/staff-service-catalog.models';

import { StaffServiceCatalogService } from './staff-service-catalog.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'owner@example.com',
    roles: [],
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

function staff(overrides: Record<string, unknown> = {}) {
  return {
    id: 'staff-1',
    businessId: 'business-1',
    displayName: 'Stylist One',
    phone: '09000000001',
    email: 'stylist@example.com',
    status: 'ACTIVE',
    roles: [],
    branches: [{ staffId: 'staff-1', branchId: 'branch-1' }],
    skills: [],
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

function prismaKnownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('known request error', {
    code,
    clientVersion: 'test',
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
      findMany: jest.fn(),
    },
    salonOwnerStaff: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    salonOwnerStaffBranch: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    salonOwnerStaffSkill: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    salonOwnerStaffShift: {
      upsert: jest.fn(),
    },
    salonOwnerStaffLeaveBlock: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    salonOwnerServiceCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    salonOwnerService: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    businessRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    businessRolePermission: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    permissionMaster: {
      findMany: jest.fn(),
    },
    staffRoleAssignment: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    staffPersonalProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    staffIdentityDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    $transaction: transactionMock,
  };
  transactionMock.mockImplementation((callback: (tx: unknown) => unknown) => Promise.resolve(callback(prisma)));
  return prisma;
}

describe('StaffServiceCatalogService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: StaffServiceCatalogService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new StaffServiceCatalogService(prisma as unknown as PrismaService);

    prisma.businessRole.findMany.mockResolvedValue([
      {
        id: 'role-stylist-1',
        businessId: 'business-1',
        roleCode: 'STYLIST',
        name: 'Stylist',
        description: 'Stylist role',
        isSystemDefault: true,
        isActive: true,
        permissions: [{ permissionCode: 'appointment.view' }],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    prisma.permissionMaster.findMany.mockResolvedValue([
      { code: 'appointment.create', name: 'Create appointments', category: 'Appointments', description: 'desc' },
      { code: 'appointment.view', name: 'View appointments', category: 'Appointments', description: 'desc' },
    ]);
    prisma.staffRoleAssignment.deleteMany.mockResolvedValue({ count: 0 });
    prisma.staffRoleAssignment.createMany.mockResolvedValue({ count: 1 });
    prisma.staffRoleAssignment.count.mockResolvedValue(0);
  });

  it('lists staff by authenticated tenant and optional branch', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerStaff.count.mockResolvedValue(1);
    prisma.salonOwnerStaff.findMany.mockResolvedValue([staff()]);

    const result = await service.listStaff({ user: user() }, { branchId: 'branch-1', q: 'stylist', page: 2, pageSize: 25 });

    expect(prisma.salonOwnerStaff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          business: { tenantId: 'tenant-1' },
          branches: { some: { branchId: 'branch-1' } },
          OR: expect.arrayContaining([expect.objectContaining({ displayName: expect.objectContaining({ contains: 'stylist' }) })]),
        }),
        skip: 25,
        take: 25,
      }),
    );
    expect(result.items[0]).toMatchObject({ id: 'staff-1', branchIds: ['branch-1'] });
    expect(result.page).toMatchObject({ page: 2, pageSize: 25, total: 1 });
  });

  it('requires tenant scope', async () => {
    await expect(service.listStaff({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates staff after validating all assigned branches are in one business', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.salonOwnerStaff.create.mockResolvedValue({ id: 'staff-1' });
    prisma.salonOwnerStaff.findUniqueOrThrow.mockResolvedValue(staff({ displayName: 'Trimmed' }));

    const result = await service.createStaff(
      { user: user() },
      {
        branchIds: ['branch-1', 'branch-1'],
        displayName: ' Trimmed ',
        phone: ' 09000000001 ',
        email: ' stylist@example.com ',
        status: 'ACTIVE',
      },
    );

    expect(result.displayName).toBe('Trimmed');
    expect(prisma.salonOwnerStaffBranch.createMany).toHaveBeenCalledWith({
      data: [{ staffId: 'staff-1', branchId: 'branch-1' }],
    });
  });

  it('maps duplicate staff phone numbers to conflict', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.salonOwnerStaff.create.mockRejectedValue(prismaKnownError('P2002'));

    await expect(
      service.createStaff(
        { user: user() },
        { branchIds: ['branch-1'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps transaction-wrapped duplicate staff phone numbers to conflict', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.$transaction.mockRejectedValue(new Error('A unique constraint was violated'));

    await expect(
      service.createStaff(
        { user: user() },
        { branchIds: ['branch-1'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects staff display names that are too short after trimming', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);

    await expect(
      service.createStaff({ user: user() }, { branchIds: ['branch-1'], displayName: ' A ', phone: '09000000001', status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.salonOwnerStaff.create).not.toHaveBeenCalled();
  });

  it('rejects staff assignments across businesses', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findMany.mockResolvedValue([branch({ id: 'branch-1' }), branch({ id: 'branch-2', businessId: 'business-2' })]);

    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1', 'branch-2'],
        displayName: 'Stylist One',
        phone: '09000000001',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('replaces roles, skills, shifts, and leave blocks with scope validation', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonOwnerStaff.update.mockResolvedValue(staff({ roles: ['STYLIST'] }));
    prisma.salonOwnerService.count.mockResolvedValue(1);
    prisma.salonOwnerStaff.findUniqueOrThrow.mockResolvedValue(staff({ skills: [{ staffId: 'staff-1', serviceId: 'service-1' }] }));
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerStaffShift.upsert.mockResolvedValue({
      id: 'shift-1',
      staffId: 'staff-1',
      branchId: 'branch-1',
      timezone: 'Asia/Tokyo',
      days: [],
      createdAt: now,
      updatedAt: now,
    });
    prisma.salonOwnerStaffLeaveBlock.create.mockResolvedValue({
      id: 'leave-1',
      staffId: 'staff-1',
      branchId: 'branch-1',
      startsAt: new Date('2026-05-26T01:00:00.000Z'),
      endsAt: new Date('2026-05-26T02:00:00.000Z'),
      reason: 'Personal',
      createdAt: now,
    });

    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', { roles: ['STYLIST', 'STYLIST'] })).resolves.toMatchObject({
      roles: ['STYLIST'],
    });
    await expect(service.replaceStaffSkills({ user: user() }, 'staff-1', { serviceIds: ['service-1'] })).resolves.toMatchObject({
      skillServiceIds: ['service-1'],
    });
    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [{ dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] }],
      }),
    ).resolves.toMatchObject({ staffId: 'staff-1', branchId: 'branch-1' });
    await expect(
      service.createStaffLeaveBlock({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        startsAt: '2026-05-26T01:00:00.000Z',
        endsAt: '2026-05-26T02:00:00.000Z',
        reason: ' Personal ',
      }),
    ).resolves.toMatchObject({ id: 'leave-1', reason: 'Personal' });
  });

  it('manages staff leave block lifecycle with filtering and deletion', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerStaffLeaveBlock.create.mockResolvedValue({
      id: 'leave-global',
      staffId: 'staff-1',
      branchId: null,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-06-05T00:00:00.000Z'),
      reason: 'Vacation',
      createdAt: now,
    });
    prisma.salonOwnerStaffLeaveBlock.findMany.mockResolvedValue([
      {
        id: 'leave-global',
        staffId: 'staff-1',
        branchId: null,
        startsAt: new Date('2026-06-01T00:00:00.000Z'),
        endsAt: new Date('2026-06-05T00:00:00.000Z'),
        reason: 'Vacation',
        createdAt: now,
      },
    ]);
    prisma.salonOwnerStaffLeaveBlock.findFirst.mockResolvedValue({
      id: 'leave-global',
      staffId: 'staff-1',
    });
    prisma.salonOwnerStaffLeaveBlock.delete.mockResolvedValue({ id: 'leave-global' });

    // Global leave creation (null branchId)
    await expect(
      service.createStaffLeaveBlock({ user: user() }, 'staff-1', {
        startsAt: '2026-06-01T00:00:00.000Z',
        endsAt: '2026-06-05T00:00:00.000Z',
        reason: 'Vacation',
      }),
    ).resolves.toMatchObject({ id: 'leave-global', branchId: null, reason: 'Vacation' });

    // List leave blocks with from/to query
    await expect(
      service.listStaffLeaveBlocks({ user: user() }, 'staff-1', {
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-30T23:59:59.000Z',
      }),
    ).resolves.toMatchObject({
      items: [{ id: 'leave-global', branchId: null }],
    });

    // Delete leave block
    await expect(service.deleteStaffLeaveBlock({ user: user() }, 'staff-1', 'leave-global')).resolves.toEqual({
      success: true,
    });
  });

  it('rejects invalid leave block query parameters and missing delete targets', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());

    await expect(service.listStaffLeaveBlocks({ user: user() }, 'staff-1', { from: 'invalid-date' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    await expect(service.listStaffLeaveBlocks({ user: user() }, 'staff-1', { to: 'invalid-date' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    await expect(
      service.listStaffLeaveBlocks({ user: user() }, 'staff-1', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-06-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    prisma.salonOwnerStaffLeaveBlock.findFirst.mockResolvedValue(null);
    await expect(service.deleteStaffLeaveBlock({ user: user() }, 'staff-1', 'missing-leave')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enforces BR-ST-11 final owner protection on role changes and deactivations', async () => {
    const ownerStaff = staff({ roles: ['OWNER'], status: 'ACTIVE' });
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(ownerStaff);
    prisma.salonOwnerStaff.count.mockResolvedValue(1); // Only 1 active owner

    // Attempting to remove OWNER role when only 1 active owner exists
    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', { roles: ['STYLIST'] })).rejects.toBeInstanceOf(ConflictException);

    // Attempting to deactivate the only active owner
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1'],
        displayName: 'Stylist One',
        phone: '09000000001',
        status: 'INACTIVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    // When another active owner exists (count = 2), removal and deactivation succeed
    prisma.salonOwnerStaff.count.mockResolvedValue(2);
    prisma.salonOwnerStaff.update.mockResolvedValue(staff({ roles: ['STYLIST'] }));
    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', { roles: ['STYLIST'] })).resolves.toMatchObject({
      roles: ['STYLIST'],
    });

    prisma.salonOwnerStaff.findUniqueOrThrow.mockResolvedValue(staff({ status: 'INACTIVE' }));
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1'],
        displayName: 'Stylist One',
        phone: '09000000001',
        status: 'INACTIVE',
      }),
    ).resolves.toMatchObject({ status: 'INACTIVE' });
  });

  it('filters staff list by businessId when provided', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business({ id: 'business-1' }));
    prisma.salonOwnerStaff.count.mockResolvedValue(1);
    prisma.salonOwnerStaff.findMany.mockResolvedValue([staff()]);

    await expect(service.listStaff({ user: user() }, { businessId: 'business-1' })).resolves.toMatchObject({
      items: [{ id: 'staff-1' }],
    });

    prisma.salonBusiness.findFirst.mockResolvedValue(null);
    await expect(service.listStaff({ user: user() }, { businessId: 'missing-business' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid shift and leave intervals', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findFirst.mockResolvedValue(branch());

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [{ dayOfWeek: 1, intervals: [{ start: '17:00', end: '09:00' }] }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.createStaffLeaveBlock({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        startsAt: '2026-05-26T02:00:00.000Z',
        endsAt: '2026-05-26T01:00:00.000Z',
        reason: 'Personal',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects staff shifts that do not match the branch timezone', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findFirst.mockResolvedValue(branch());

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'UTC',
        days: [{ dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('creates categories and maps duplicates to conflict', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonOwnerServiceCategory.create.mockResolvedValue(category({ name: 'Hair' }));

    await expect(service.createServiceCategory({ user: user() }, { name: ' Hair ', sortOrder: 1 })).resolves.toEqual({
      id: 'category-1',
      name: 'Hair',
      sortOrder: 1,
    });

    prisma.salonOwnerServiceCategory.create.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(service.createServiceCategory({ user: user() }, { name: 'Hair', sortOrder: 1 })).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists categories and returns not found when no tenant business exists', async () => {
    prisma.salonBusiness.findMany.mockResolvedValueOnce([business()]);
    prisma.salonOwnerServiceCategory.findMany.mockResolvedValue([category()]);

    await expect(service.listServiceCategories({ user: user() })).resolves.toMatchObject({ items: [{ id: 'category-1' }] });

    prisma.salonBusiness.findMany.mockResolvedValueOnce([]);
    await expect(service.listServiceCategories({ user: user() })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires explicit business scope when multiple businesses exist', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business(), business({ id: 'business-2' })]);

    await expect(service.listServiceCategories({ user: user() })).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('uses explicit business scope for catalog operations', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business({ id: 'business-2' }));
    prisma.salonOwnerServiceCategory.create.mockResolvedValue(category({ businessId: 'business-2', name: 'Hair' }));

    await expect(
      service.createServiceCategory({ user: user() }, { businessId: 'business-2', name: ' Hair ', sortOrder: 1 }),
    ).resolves.toMatchObject({ id: 'category-1' });

    expect(prisma.salonBusiness.findFirst).toHaveBeenCalledWith({ where: { id: 'business-2', tenantId: 'tenant-1' } });
    expect(prisma.salonOwnerServiceCategory.create).toHaveBeenCalledWith({
      data: { businessId: 'business-2', name: 'Hair', sortOrder: 1 },
    });
  });

  it('creates, updates, and statuses services under the scoped business', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
    prisma.salonOwnerService.create.mockResolvedValue(serviceRecord({ name: 'Trimmed Cut' }));
    prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
    prisma.salonOwnerService.update.mockResolvedValue(serviceRecord({ status: 'INACTIVE' }));

    const input = {
      categoryId: 'category-1',
      name: ' Trimmed Cut ',
      durationMinutes: 45,
      bufferMinutes: 5,
      basePrice: '35',
      taxRatePercent: '10',
      status: 'ACTIVE' as const,
    };

    await expect(service.createService({ user: user() }, input)).resolves.toMatchObject({ name: 'Trimmed Cut', basePrice: '35.00' });
    await expect(service.updateService({ user: user() }, 'service-1', input)).resolves.toMatchObject({ status: 'INACTIVE' });
    await expect(service.updateServiceStatus({ user: user() }, 'service-1', { status: 'INACTIVE' })).resolves.toMatchObject({
      status: 'INACTIVE',
    });
  });

  it('rejects service monetary values that exceed database precision', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());

    await expect(
      service.createService(
        { user: user() },
        {
          categoryId: 'category-1',
          name: 'Cut',
          durationMinutes: 45,
          basePrice: '123456789.00',
          taxRatePercent: '10.00',
          status: 'ACTIVE',
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects service updates scoped to a different business', async () => {
    prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());

    await expect(
      service.updateService({ user: user() }, 'service-1', {
        businessId: 'business-2',
        categoryId: 'category-1',
        name: 'Cut',
        durationMinutes: 45,
        basePrice: '35.00',
        taxRatePercent: '10.00',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists services by category and replaces service staff eligibility', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
    prisma.salonOwnerService.findMany.mockResolvedValue([serviceRecord()]);
    prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
    prisma.salonOwnerStaff.count.mockResolvedValue(1);
    prisma.salonOwnerService.findUniqueOrThrow.mockResolvedValue(
      serviceRecord({ skills: [{ serviceId: 'service-1', staffId: 'staff-1' }] }),
    );

    await expect(service.listServices({ user: user() }, { categoryId: 'category-1' })).resolves.toMatchObject({
      items: [{ id: 'service-1' }],
    });
    await expect(
      service.replaceServiceStaffEligibility({ user: user() }, 'service-1', { staffIds: ['staff-1', 'staff-1'] }),
    ).resolves.toMatchObject({ eligibleStaffIds: ['staff-1'] });
  });

  it('covers staff retrieval, updates, empty skill/eligibility replacements, and error branches', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff({ email: null }));
    await expect(service.getStaff({ user: user() }, 'staff-1')).resolves.toMatchObject({ id: 'staff-1' });

    prisma.salonBranch.findMany.mockResolvedValueOnce([branch({ id: 'branch-2', businessId: 'business-2' })]);
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-2'],
        displayName: 'Stylist One',
        phone: '09000000001',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.salonOwnerStaff.findUniqueOrThrow.mockResolvedValue(staff({ displayName: 'Updated Stylist' }));
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1'],
        displayName: 'Updated Stylist',
        phone: '09000000001',
        status: 'ACTIVE',
      }),
    ).resolves.toMatchObject({ displayName: 'Updated Stylist' });

    prisma.salonOwnerStaff.update.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1'],
        displayName: 'Updated Stylist',
        phone: '09000000001',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonOwnerStaff.update.mockRejectedValueOnce(new Error('unexpected staff update error'));
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1'],
        displayName: 'Updated Stylist',
        phone: '09000000001',
        status: 'ACTIVE',
      }),
    ).rejects.toThrow('unexpected staff update error');

    prisma.salonOwnerStaff.create.mockRejectedValueOnce(new Error('unexpected staff create error'));
    await expect(
      service.createStaff(
        { user: user() },
        { branchIds: ['branch-1'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' },
      ),
    ).rejects.toThrow('unexpected staff create error');

    await expect(service.replaceStaffSkills({ user: user() }, 'staff-1', { serviceIds: [] })).resolves.toMatchObject({ id: 'staff-1' });
    prisma.salonOwnerService.count.mockResolvedValueOnce(0);
    await expect(service.replaceStaffSkills({ user: user() }, 'staff-1', { serviceIds: ['missing-service'] })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
    prisma.salonOwnerService.findUniqueOrThrow.mockResolvedValue(serviceRecord());
    await expect(service.getService({ user: user() }, 'service-1')).resolves.toMatchObject({ id: 'service-1' });
    await expect(service.replaceServiceStaffEligibility({ user: user() }, 'service-1', { staffIds: [] })).resolves.toMatchObject({
      id: 'service-1',
    });
    prisma.salonOwnerStaff.count.mockResolvedValueOnce(0);
    await expect(
      service.replaceServiceStaffEligibility({ user: user() }, 'service-1', { staffIds: ['missing-staff'] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('covers shift/leave validation and not-found/conflict error branches across catalog operations', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerStaffShift.upsert.mockResolvedValue({
      id: 'shift-1',
      staffId: 'staff-1',
      branchId: 'branch-1',
      timezone: 'Asia/Tokyo',
      days: [],
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Invalid/Timezone',
        days: [],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [{ dayOfWeek: 1, intervals: [{ start: '25:00', end: '26:00' }] }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [
          {
            dayOfWeek: 1,
            intervals: [
              { start: '13:00', end: '15:00' },
              { start: '09:00', end: '14:00' },
            ],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [
          { dayOfWeek: 1, intervals: [{ start: '09:00', end: '12:00' }] },
          { dayOfWeek: 1, intervals: [{ start: '13:00', end: '17:00' }] },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [
          { dayOfWeek: 2, intervals: [{ start: '09:00', end: '12:00' }] },
          { dayOfWeek: 1, intervals: [{ start: '09:00', end: '12:00' }] },
        ],
      }),
    ).resolves.toMatchObject({ days: [{ dayOfWeek: 1 }, { dayOfWeek: 2 }] });

    prisma.salonBranch.findFirst.mockResolvedValueOnce(branch({ id: 'branch-unassigned' }));
    await expect(
      service.replaceStaffShifts({ user: user() }, 'staff-1', {
        branchId: 'branch-unassigned',
        timezone: 'Asia/Tokyo',
        days: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.salonBranch.findFirst.mockResolvedValueOnce(branch({ id: 'branch-unassigned' }));
    await expect(
      service.createStaffLeaveBlock({ user: user() }, 'staff-1', {
        branchId: 'branch-unassigned',
        startsAt: '2026-05-26T01:00:00.000Z',
        endsAt: '2026-05-26T02:00:00.000Z',
        reason: 'Personal',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonOwnerServiceCategory.create.mockRejectedValueOnce(new Error('unexpected category error'));
    await expect(service.createServiceCategory({ user: user() }, { name: 'Hair', sortOrder: 1 })).rejects.toThrow(
      'unexpected category error',
    );

    prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
    prisma.salonOwnerService.create.mockRejectedValueOnce(prismaKnownError('P2002'));
    const serviceInput = {
      categoryId: 'category-1',
      name: 'Cut',
      durationMinutes: 45,
      basePrice: '35.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE' as const,
    };
    await expect(service.createService({ user: user() }, serviceInput)).rejects.toBeInstanceOf(ConflictException);

    prisma.salonOwnerService.create.mockRejectedValueOnce(new Error('unexpected service create error'));
    await expect(service.createService({ user: user() }, serviceInput)).rejects.toThrow('unexpected service create error');

    prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
    prisma.salonOwnerService.update.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(service.updateService({ user: user() }, 'service-1', serviceInput)).rejects.toBeInstanceOf(ConflictException);

    prisma.salonOwnerService.update.mockRejectedValueOnce(new Error('unexpected service update error'));
    await expect(service.updateService({ user: user() }, 'service-1', serviceInput)).rejects.toThrow('unexpected service update error');

    prisma.salonBusiness.findFirst.mockResolvedValueOnce(null);
    await expect(service.listServiceCategories({ user: user() }, 'missing-business')).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonBranch.findFirst.mockResolvedValueOnce(null);
    await expect(service.listStaff({ user: user() }, { branchId: 'missing-branch' })).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.createStaff({ user: user() }, { branchIds: [], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    prisma.salonBranch.findMany.mockResolvedValueOnce([]);
    await expect(
      service.createStaff(
        { user: user() },
        { branchIds: ['missing-branch'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(null);
    await expect(service.getStaff({ user: user() }, 'missing-staff')).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonOwnerServiceCategory.findFirst.mockResolvedValueOnce(null);
    await expect(service.listServices({ user: user() }, { categoryId: 'missing-category' })).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonOwnerService.findFirst.mockResolvedValueOnce(null);
    await expect(service.getService({ user: user() }, 'missing-service')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('manages business roles and system permissions with validation and invariants', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.permissionMaster.findMany.mockResolvedValue([
      { code: 'appointment.create', name: 'Create appointments', category: 'Appointments', description: 'desc' },
      { code: 'appointment.view', name: 'View appointments', category: 'Appointments', description: 'desc' },
    ]);

    // listSystemPermissions
    const permissions = await service.listSystemPermissions();
    expect(permissions).toHaveLength(2);
    expect(permissions[0]).toEqual({
      code: 'appointment.create',
      name: 'Create appointments',
      category: 'Appointments',
      description: 'desc',
    });

    // listBusinessRoles with default query (active only)
    const mockRole = {
      id: 'role-1',
      businessId: 'business-1',
      roleCode: 'CUSTOM',
      name: 'Colorist',
      description: 'Colorist role',
      isSystemDefault: false,
      isActive: true,
      permissions: [{ permissionCode: 'appointment.create' }],
      createdAt: now,
      updatedAt: now,
    };
    prisma.businessRole.findMany.mockResolvedValue([mockRole]);
    const roles = await service.listBusinessRoles({ user: user() });
    expect(roles).toHaveLength(1);
    expect(roles[0]).toMatchObject({ name: 'Colorist', permissions: ['appointment.create'] });
    expect(prisma.businessRole.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );

    // listBusinessRoles with includeInactive
    await service.listBusinessRoles({ user: user() }, { includeInactive: true });
    expect(prisma.businessRole.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: 'business-1' }),
      }),
    );

    // createBusinessRole success
    prisma.businessRole.findFirst.mockResolvedValue(null);
    prisma.businessRole.create.mockResolvedValue(mockRole);
    prisma.businessRole.findUniqueOrThrow.mockResolvedValue(mockRole);
    const createdRole = await service.createBusinessRole(
      { user: user() },
      {
        name: 'Colorist',
        description: 'Colorist role',
        permissions: ['appointment.create'],
        isActive: true,
      },
    );
    expect(createdRole).toMatchObject({ name: 'Colorist' });

    // createBusinessRole validation errors
    await expect(service.createBusinessRole({ user: user() }, { name: ' ', permissions: ['appointment.create'] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    await expect(service.createBusinessRole({ user: user() }, { name: 'Colorist', permissions: [] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    // invalid permissions (not in permissionMaster)
    prisma.permissionMaster.findMany.mockResolvedValueOnce([]);
    await expect(service.createBusinessRole({ user: user() }, { name: 'Colorist', permissions: ['invalid.perm'] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    // duplicate name conflict
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    await expect(
      service.createBusinessRole({ user: user() }, { name: 'Colorist', permissions: ['appointment.create'] }),
    ).rejects.toBeInstanceOf(ConflictException);

    // P2002 duplicate error during create
    prisma.businessRole.findFirst.mockResolvedValueOnce(null);
    prisma.businessRole.create.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(
      service.createBusinessRole({ user: user() }, { name: 'Colorist', permissions: ['appointment.create'] }),
    ).rejects.toBeInstanceOf(ConflictException);

    // unexpected error during create
    prisma.businessRole.findFirst.mockResolvedValueOnce(null);
    prisma.businessRole.create.mockRejectedValueOnce(new Error('unexpected create error'));
    await expect(service.createBusinessRole({ user: user() }, { name: 'Colorist', permissions: ['appointment.create'] })).rejects.toThrow(
      'unexpected create error',
    );

    // updateBusinessRole not found
    prisma.businessRole.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.updateBusinessRole({ user: user() }, 'missing-role', { name: 'Updated', permissions: ['appointment.create'] }),
    ).rejects.toBeInstanceOf(NotFoundException);

    // updateBusinessRole name collision
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole).mockResolvedValueOnce({ ...mockRole, id: 'role-2', name: 'Duplicate' });
    await expect(
      service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Duplicate', permissions: ['appointment.create'] }),
    ).rejects.toBeInstanceOf(ConflictException);

    // updateBusinessRole invalid permissions
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    await expect(service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Colorist', permissions: [] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.permissionMaster.findMany.mockResolvedValueOnce([]);
    await expect(
      service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Colorist', permissions: ['invalid.perm'] }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    // updateBusinessRole BR-ST-06.1: cannot deactivate OWNER role
    const ownerRole = { ...mockRole, roleCode: 'OWNER', name: 'Owner' };
    prisma.businessRole.findFirst.mockResolvedValueOnce(ownerRole);
    await expect(
      service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Owner', permissions: ['appointment.create'], isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);

    // updateBusinessRole BR-ST-13: cannot deactivate in-use role
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.staffRoleAssignment.count.mockResolvedValueOnce(1);
    await expect(
      service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Colorist', permissions: ['appointment.create'], isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);

    // updateBusinessRole success
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.businessRole.update.mockResolvedValue(mockRole);
    prisma.businessRole.findUniqueOrThrow.mockResolvedValue(mockRole);
    const updatedRole = await service.updateBusinessRole({ user: user() }, 'role-1', {
      name: 'Colorist',
      description: 'Updated description',
      permissions: ['appointment.create'],
      isActive: true,
    });
    expect(updatedRole).toMatchObject({ name: 'Colorist' });

    // updateBusinessRole P2002 duplicate
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.businessRole.update.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(
      service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Colorist', permissions: ['appointment.create'] }),
    ).rejects.toBeInstanceOf(ConflictException);

    // updateBusinessRole unexpected error
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.businessRole.update.mockRejectedValueOnce(new Error('unexpected update error'));
    await expect(
      service.updateBusinessRole({ user: user() }, 'role-1', { name: 'Colorist', permissions: ['appointment.create'] }),
    ).rejects.toThrow('unexpected update error');

    // deleteBusinessRole not found
    prisma.businessRole.findFirst.mockResolvedValueOnce(null);
    await expect(service.deleteBusinessRole({ user: user() }, 'missing-role')).rejects.toBeInstanceOf(NotFoundException);

    // deleteBusinessRole cannot delete OWNER role
    prisma.businessRole.findFirst.mockResolvedValueOnce(ownerRole);
    await expect(service.deleteBusinessRole({ user: user() }, 'role-owner')).rejects.toBeInstanceOf(ConflictException);

    // deleteBusinessRole cannot delete in-use role
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.staffRoleAssignment.count.mockResolvedValueOnce(2);
    await expect(service.deleteBusinessRole({ user: user() }, 'role-1')).rejects.toBeInstanceOf(ConflictException);

    // deleteBusinessRole success
    prisma.businessRole.findFirst.mockResolvedValueOnce(mockRole);
    prisma.staffRoleAssignment.count.mockResolvedValueOnce(0);
    const deleteResult = await service.deleteBusinessRole({ user: user() }, 'role-1');
    expect(deleteResult).toEqual({ success: true });
    expect(prisma.businessRole.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'role-1' }, data: { isActive: false } }),
    );
  });

  it('handles replaceStaffRoles with roleIds, validation, and mappings', async () => {
    const activeStaff = staff({ roles: ['STYLIST'], status: 'ACTIVE' });
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(activeStaff);

    const mockRole = {
      id: '11111111-1111-4111-8111-111111111111',
      businessId: 'business-1',
      roleCode: 'STYLIST',
      name: 'Stylist',
      description: null,
      isSystemDefault: true,
      isActive: true,
      permissions: [],
      createdAt: now,
      updatedAt: now,
    };

    // replaceStaffRoles with roleIds
    prisma.businessRole.findMany.mockResolvedValueOnce([mockRole]);
    prisma.salonOwnerStaff.update.mockResolvedValue({
      ...activeStaff,
      roleAssignments: [{ staffId: 'staff-1', businessRoleId: mockRole.id, businessRole: mockRole }],
    });
    const result = await service.replaceStaffRoles({ user: user() }, 'staff-1', {
      roleIds: [mockRole.id],
    });
    expect(result.roleIds).toEqual([mockRole.id]);
    expect(result.roles).toEqual(['STYLIST']);

    // replaceStaffRoles with roleIds where not found in business
    prisma.businessRole.findMany.mockResolvedValueOnce([]);
    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', { roleIds: ['missing-role-id'] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    // replaceStaffRoles with roles where not found
    prisma.businessRole.findMany.mockResolvedValueOnce([]);
    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', { roles: ['MISSING_ROLE'] })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );

    // replaceStaffRoles with empty input (neither roleIds nor roles)
    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', {})).rejects.toBeInstanceOf(UnprocessableEntityException);

    // mapStaff with roleAssignments where businessRole has no roleCode (uses name)
    const customRole = { ...mockRole, roleCode: null, name: 'Lead Colorist' };
    prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce({
      ...activeStaff,
      roleAssignments: [{ staffId: 'staff-1', businessRoleId: customRole.id, businessRole: customRole }],
    });
    const staffWithCustom = await service.getStaff({ user: user() }, 'staff-1');
    expect(staffWithCustom.roles).toEqual(['Lead Colorist']);
    expect(staffWithCustom.roleIds).toEqual([customRole.id]);

    // BR-ST-06.1 when owner status is derived from roleAssignments instead of legacy roles array
    const assignedOwnerStaff = {
      ...activeStaff,
      roles: [],
      roleAssignments: [{ staffId: 'staff-1', businessRoleId: 'owner-role-id', businessRole: { roleCode: 'OWNER', name: 'Owner' } }],
    };
    prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(assignedOwnerStaff);
    prisma.salonBranch.findMany.mockResolvedValueOnce([branch()]);
    prisma.salonOwnerStaff.count.mockResolvedValueOnce(1); // final owner
    await expect(
      service.updateStaff({ user: user() }, 'staff-1', {
        branchIds: ['branch-1'],
        displayName: 'Owner Staff',
        phone: '09000000001',
        status: 'INACTIVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(assignedOwnerStaff);
    prisma.businessRole.findMany.mockResolvedValueOnce([mockRole]); // role without OWNER
    prisma.salonOwnerStaff.count.mockResolvedValueOnce(1); // final owner
    await expect(service.replaceStaffRoles({ user: user() }, 'staff-1', { roleIds: [mockRole.id] })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  describe('Staff Personal HR Details and Identity Documents', () => {
    const ownerUser = user({ roles: ['OWNER'] });
    const managerUser = user({ id: 'manager-1', roles: ['MANAGER'], managedBranchIds: ['branch-1'] });
    const otherManagerUser = user({ id: 'manager-2', roles: ['MANAGER'], managedBranchIds: ['branch-99'] });
    const staffUser = user({ id: 'user-stylist', email: 'stylist@example.com', roles: ['STAFF'] });
    const otherStaffUser = user({ id: 'user-other', email: 'other@example.com', roles: ['STAFF'] });

    const baseStaff = staff({
      id: 'staff-1',
      userId: 'user-stylist',
      email: 'stylist@example.com',
      branches: [{ staffId: 'staff-1', branchId: 'branch-1' }],
    });

    const mockProfile = {
      staffId: 'staff-1',
      legalName: 'Elena Vance',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      addressLine1: '1-2-3 Shibuya',
      addressLine2: 'Apt 101',
      city: 'Shibuya',
      state: 'Tokyo',
      postalCode: '150-0002',
      country: 'JP',
      emergencyContactName: 'Marcus Vance',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '09099990001',
      employmentType: 'FULL_TIME',
      hireDate: new Date('2020-01-10'),
      terminationDate: null,
      payoutMethod: 'BANK_TRANSFER',
      bankName: 'Mizuho Bank',
      branchName: 'Shibuya Branch',
      branchCode: '210',
      accountType: 'ORDINARY',
      accountNumber: '1234567',
      accountHolderName: 'ELENA VANCE',
      createdAt: now,
      updatedAt: now,
    };

    const mockDoc = {
      id: 'doc-1',
      staffId: 'staff-1',
      documentType: 'DRIVERS_LICENSE',
      fileKey: 'secure/doc-1.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1048576,
      verificationStatus: 'PENDING_VERIFICATION',
      verifiedByUserId: null,
      verifiedAt: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };

    describe('getStaffPersonalDetails', () => {
      it('allows owner to get staff personal details', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(mockProfile);

        const result = await service.getStaffPersonalDetails({ user: ownerUser }, 'staff-1');
        expect(result.staffId).toBe('staff-1');
        expect(result.legalName).toBe('Elena Vance');
        expect(result.payoutMethod).toBe('BANK_TRANSFER');
        expect(result.bankDetails?.bankName).toBe('Mizuho Bank');
      });

      it('allows assigned branch manager to get staff personal details', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(mockProfile);

        const result = await service.getStaffPersonalDetails({ user: managerUser }, 'staff-1');
        expect(result.staffId).toBe('staff-1');

        // Global manager with canManageBranches: true and no specific managedBranchIds
        const globalManager = user({ id: 'manager-global', roles: ['MANAGER'], canManageBranches: true });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(mockProfile);
        const globalResult = await service.getStaffPersonalDetails({ user: globalManager }, 'staff-1');
        expect(globalResult.staffId).toBe('staff-1');
      });

      it('forbids manager not assigned to staff branch', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);

        await expect(service.getStaffPersonalDetails({ user: otherManagerUser }, 'staff-1')).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('allows staff member to view own personal details', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(mockProfile);

        const result = await service.getStaffPersonalDetails({ user: staffUser }, 'staff-1');
        expect(result.staffId).toBe('staff-1');

        // Match self by staff.id === user.id
        const staffSameId = staff({ id: 'staff-same-id', userId: null, email: null });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(staffSameId);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(null);
        const resSameId = await service.getStaffPersonalDetails({ user: user({ id: 'staff-same-id' }) }, 'staff-same-id');
        expect(resSameId.staffId).toBe('staff-same-id');

        // Match self by staff.email === user.email
        const staffSameEmail = staff({ id: 'staff-diff', userId: null, email: 'same@example.com' });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(staffSameEmail);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(null);
        const resSameEmail = await service.getStaffPersonalDetails(
          { user: user({ id: 'user-diff', email: 'same@example.com' }) },
          'staff-diff',
        );
        expect(resSameEmail.staffId).toBe('staff-diff');

        // Role as object in AuthenticatedUser
        const userWithObjectRole = user({ roles: [{ id: 1, name: 'owner' }] as any });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(mockProfile);
        const resObjRole = await service.getStaffPersonalDetails({ user: userWithObjectRole }, 'staff-1');
        expect(resObjRole.staffId).toBe('staff-1');
      });

      it('forbids other staff member from viewing personal details', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);

        await expect(service.getStaffPersonalDetails({ user: otherStaffUser }, 'staff-1')).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('returns default profile if not yet created in database', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.findUnique.mockResolvedValueOnce(null);

        const result = await service.getStaffPersonalDetails({ user: ownerUser }, 'staff-1');
        expect(result.staffId).toBe('staff-1');
        expect(result.legalName).toBeNull();
        expect(result.employmentType).toBe('FULL_TIME');
        expect(result.payoutMethod).toBe('CASH');
      });
    });

    describe('updateStaffPersonalDetails', () => {
      const validBankInput = {
        legalName: 'Elena Vance',
        dateOfBirth: '1990-05-15',
        gender: 'FEMALE' as const,
        address: {
          line1: '1-2-3 Shibuya',
          city: 'Shibuya',
          state: 'Tokyo',
          postalCode: '150-0002',
          country: 'JP',
        },
        emergencyContact: {
          name: 'Marcus Vance',
          relationship: 'Spouse',
          phone: '09099990001',
        },
        employmentType: 'FULL_TIME' as const,
        hireDate: '2020-01-10',
        payoutMethod: 'BANK_TRANSFER' as const,
        bankDetails: {
          bankName: 'Mizuho Bank',
          branchName: 'Shibuya Branch',
          branchCode: '210',
          accountType: 'ORDINARY' as const,
          accountNumber: '1234567',
          accountHolder: 'ELENA VANCE',
        },
      };

      it('updates personal details with bank transfer details for owner', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce(mockProfile);

        const result = await service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', validBankInput);
        expect(result.staffId).toBe('staff-1');
        expect(prisma.staffPersonalProfile.upsert).toHaveBeenCalled();
        expect(prisma.auditEvent.create).toHaveBeenCalled();
      });

      it('updates personal details with cash payout for assigned manager', async () => {
        const cashInput = {
          ...validBankInput,
          payoutMethod: 'CASH' as const,
          bankDetails: undefined,
          terminationDate: '2028-01-01',
        };
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce({
          ...mockProfile,
          payoutMethod: 'CASH',
          terminationDate: new Date('2028-01-01'),
        });

        const result = await service.updateStaffPersonalDetails({ user: managerUser }, 'staff-1', cashInput);
        expect(result.payoutMethod).toBe('CASH');
        expect(result.terminationDate).toBe('2028-01-01');

        // Minimal input without address, emergencyContact, dateOfBirth
        const minimalInput = {
          employmentType: 'CONTRACTOR' as const,
          hireDate: '2023-01-01',
          payoutMethod: 'CASH' as const,
        };
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce({
          staffId: 'staff-1',
          legalName: null,
          dateOfBirth: null,
          gender: null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          state: null,
          postalCode: null,
          country: 'JP',
          emergencyContactName: null,
          emergencyContactRelationship: null,
          emergencyContactPhone: null,
          employmentType: 'CONTRACTOR',
          hireDate: new Date('2023-01-01'),
          terminationDate: null,
          payoutMethod: 'CASH',
          bankName: null,
          branchName: null,
          branchCode: null,
          accountType: null,
          accountNumber: null,
          accountHolderName: null,
          createdAt: now,
          updatedAt: now,
        });
        const minResult = await service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', minimalInput);
        expect(minResult.employmentType).toBe('CONTRACTOR');
        expect(minResult.address).toBeUndefined();
        expect(minResult.emergencyContact).toBeUndefined();
        expect(minResult.bankDetails).toBeUndefined();
      });

      it('forbids staff self-update on the full personal endpoint', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);

        await expect(service.updateStaffPersonalDetails({ user: staffUser }, 'staff-1', validBankInput)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
      });

      it('validates legal name bounds', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, legalName: 'X' }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('validates date of birth minimum age (15 years)', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, dateOfBirth: '2025-01-01' }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, dateOfBirth: 'invalid-date' }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('validates gender and employment type enums', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, gender: 'INVALID' as any }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, employmentType: 'INVALID' as any }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, payoutMethod: 'INVALID' as any }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('validates hire date and termination date logic', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, hireDate: 'invalid' }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            hireDate: '2022-01-01',
            terminationDate: '2020-01-01',
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('validates bank transfer required fields (BR-ST-18)', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', { ...validBankInput, bankDetails: undefined }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            bankDetails: { ...validBankInput.bankDetails, bankName: '' },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            bankDetails: { ...validBankInput.bankDetails, branchName: '', branchCode: '' },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            bankDetails: { ...validBankInput.bankDetails, accountType: 'INVALID' as any },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            bankDetails: { ...validBankInput.bankDetails, accountNumber: '123' }, // < 4 digits
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            bankDetails: { ...validBankInput.bankDetails, accountHolder: '' },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('validates address and emergency contact length constraints', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            address: { line1: 'a'.repeat(125) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            address: { line2: 'b'.repeat(125) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            address: { city: 'c'.repeat(65) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            address: { state: 's'.repeat(65) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            address: { postalCode: 'p'.repeat(25) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            emergencyContact: { name: 'A' }, // < 2 chars
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            emergencyContact: { relationship: 'r'.repeat(45) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', {
            ...validBankInput,
            emergencyContact: { phone: '0'.repeat(35) },
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('gracefully handles audit event write error', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce(mockProfile);
        prisma.auditEvent.create.mockRejectedValueOnce(new Error('Audit failure'));

        const result = await service.updateStaffPersonalDetails({ user: ownerUser }, 'staff-1', validBankInput);
        expect(result.staffId).toBe('staff-1');
      });
    });

    describe('selfUpdateStaffContact (BR-ST-16 & BR-ST-17)', () => {
      it('allows staff to self-update phone, address, and emergency contact', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.salonOwnerStaff.update.mockResolvedValueOnce({ ...baseStaff, phone: '09012345678' });
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce(mockProfile);

        const result = await service.selfUpdateStaffContact(
          { user: staffUser },
          {
            phone: '09012345678',
            address: { line1: 'New Address', city: 'Tokyo', postalCode: '150-0001' },
            emergencyContact: { name: 'New Contact', phone: '09088887777' },
          },
        );

        expect(result.success).toBe(true);
        expect(prisma.salonOwnerStaff.update).toHaveBeenCalled();
        expect(prisma.staffPersonalProfile.upsert).toHaveBeenCalled();
        expect(prisma.auditEvent.create).toHaveBeenCalled();

        // Update only phone
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.salonOwnerStaff.update.mockResolvedValueOnce({ ...baseStaff, phone: '09055556666' });
        const resPhoneOnly = await service.selfUpdateStaffContact({ user: staffUser }, { phone: '09055556666' });
        expect(resPhoneOnly.success).toBe(true);

        // Update only address
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce(mockProfile);
        const resAddressOnly = await service.selfUpdateStaffContact({ user: staffUser }, { address: { line1: 'Only Address' } });
        expect(resAddressOnly.success).toBe(true);

        // Update only emergency contact
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffPersonalProfile.upsert.mockResolvedValueOnce(mockProfile);
        const resEmergencyOnly = await service.selfUpdateStaffContact(
          { user: staffUser },
          { emergencyContact: { name: 'Only Emergency' } },
        );
        expect(resEmergencyOnly.success).toBe(true);

        // Map personal profile with no defaultHireDate
        const mappedNullProfile = (service as any).mapPersonalProfile('staff-1', null);
        expect(mappedNullProfile.employmentType).toBe('FULL_TIME');
      });

      it('rejects forbidden fields in self-service edit with 403 (BR-ST-16)', async () => {
        await expect(service.selfUpdateStaffContact({ user: staffUser }, { legalName: 'Hacker Name' } as any)).rejects.toBeInstanceOf(
          ForbiddenException,
        );

        await expect(service.selfUpdateStaffContact({ user: staffUser }, { employmentType: 'PART_TIME' } as any)).rejects.toBeInstanceOf(
          ForbiddenException,
        );

        await expect(service.selfUpdateStaffContact({ user: staffUser }, { roles: ['OWNER'] } as any)).rejects.toBeInstanceOf(
          ForbiddenException,
        );

        await expect(service.selfUpdateStaffContact({ user: staffUser }, { branchIds: ['branch-2'] } as any)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
      });

      it('throws NotFoundException if calling user has no staff profile', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(null);

        await expect(service.selfUpdateStaffContact({ user: otherStaffUser }, { phone: '09011112222' })).rejects.toBeInstanceOf(
          NotFoundException,
        );
      });
    });

    describe('Staff Identity Documents', () => {
      const validDocInput = {
        documentType: 'DRIVERS_LICENSE' as const,
        fileKey: 'secure/doc-1.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1048576,
      };

      it('uploads identity document for owner, manager, or self', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffIdentityDocument.create.mockResolvedValueOnce(mockDoc);

        const result = await service.uploadStaffIdentityDocument({ user: staffUser }, 'staff-1', validDocInput);
        expect(result.id).toBe('doc-1');
        expect(result.verificationStatus).toBe('PENDING_VERIFICATION');
        expect(result.downloadUrl).toContain('/documents/doc-1/download');
      });

      it('validates document upload file format and size limits', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.uploadStaffIdentityDocument({ user: staffUser }, 'staff-1', {
            ...validDocInput,
            documentType: 'INVALID' as any,
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.uploadStaffIdentityDocument({ user: staffUser }, 'staff-1', {
            ...validDocInput,
            mimeType: 'text/plain',
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.uploadStaffIdentityDocument({ user: staffUser }, 'staff-1', {
            ...validDocInput,
            fileSizeBytes: 20000000, // > 10MB
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('lists identity documents for authorized users', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffIdentityDocument.findMany.mockResolvedValueOnce([mockDoc]);

        const list = await service.listStaffIdentityDocuments({ user: ownerUser }, 'staff-1');
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe('doc-1');
      });

      it('verifies identity document by owner or manager', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffIdentityDocument.findFirst.mockResolvedValueOnce(mockDoc);
        prisma.staffIdentityDocument.update.mockResolvedValueOnce({
          ...mockDoc,
          verificationStatus: 'VERIFIED',
          verifiedByUserId: 'user-1',
          verifiedAt: now,
        });

        const verified = await service.verifyStaffIdentityDocument({ user: ownerUser }, 'staff-1', 'doc-1', {
          verificationStatus: 'VERIFIED',
        });
        expect(verified.verificationStatus).toBe('VERIFIED');
      });

      it('rejects verification by self (staff member without manager role)', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);

        await expect(
          service.verifyStaffIdentityDocument({ user: staffUser }, 'staff-1', 'doc-1', {
            verificationStatus: 'VERIFIED',
          }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('requires rejection reason when document is rejected', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);

        await expect(
          service.verifyStaffIdentityDocument({ user: ownerUser }, 'staff-1', 'doc-1', {
            verificationStatus: 'REJECTED',
            rejectionReason: '',
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);

        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(
          service.verifyStaffIdentityDocument({ user: ownerUser }, 'staff-1', 'doc-1', {
            verificationStatus: 'PENDING_VERIFICATION' as any,
          }),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('throws NotFoundException if document does not exist', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffIdentityDocument.findFirst.mockResolvedValueOnce(null);

        await expect(
          service.verifyStaffIdentityDocument({ user: ownerUser }, 'staff-1', 'doc-missing', {
            verificationStatus: 'VERIFIED',
          }),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('verifies identity document rejection by owner with valid reason', async () => {
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        prisma.staffIdentityDocument.findFirst.mockResolvedValueOnce(mockDoc);
        prisma.staffIdentityDocument.update.mockResolvedValueOnce({
          ...mockDoc,
          verificationStatus: 'REJECTED',
          verifiedByUserId: 'user-1',
          verifiedAt: now,
          rejectionReason: 'Blurry document image',
        });

        const rejected = await service.verifyStaffIdentityDocument({ user: user({ id: 'user-1', roles: ['OWNER'] }) }, 'staff-1', 'doc-1', {
          verificationStatus: 'REJECTED',
          rejectionReason: 'Blurry document image',
        });
        expect(rejected.verificationStatus).toBe('REJECTED');
        expect(rejected.rejectionReason).toBe('Blurry document image');
      });

      it('maps personal profile with partial address, partial emergency, and partial bank details', async () => {
        type ServiceInternals = {
          mapPersonalProfile: (staffId: string, profile: unknown) => StaffPersonalProfileModel;
          recordAuditEvent: (userId?: string, tenantId?: string, action?: string, targetId?: string) => Promise<void>;
        };
        const internals = service as unknown as ServiceInternals;

        const partialProfile1 = {
          staffId: 'staff-1',
          legalName: 'Test',
          dateOfBirth: null,
          gender: null,
          addressLine1: null,
          addressLine2: null,
          city: 'Tokyo',
          state: null,
          postalCode: null,
          country: null,
          emergencyContactName: null,
          emergencyContactRelationship: null,
          emergencyContactPhone: '09012345678',
          employmentType: 'FULL_TIME' as const,
          hireDate: new Date('2025-01-01'),
          terminationDate: null,
          payoutMethod: 'BANK_TRANSFER' as const,
          bankName: null,
          branchName: null,
          branchCode: null,
          accountType: null,
          accountNumber: '1234567',
          accountHolderName: null,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        };

        const res1 = internals.mapPersonalProfile('staff-1', partialProfile1);
        expect(res1.address?.city).toBe('Tokyo');
        expect(res1.address?.line1).toBeUndefined();
        expect(res1.address?.country).toBe('JP');
        expect(res1.emergencyContact?.phone).toBe('09012345678');
        expect(res1.emergencyContact?.name).toBeUndefined();
        expect(res1.bankDetails?.accountNumber).toBe('1234567');
        expect(res1.bankDetails?.bankName).toBeUndefined();

        const partialProfile2 = {
          ...partialProfile1,
          addressLine1: 'Line 1',
          city: null,
          country: 'US',
          emergencyContactName: 'Jane',
          emergencyContactPhone: null,
          bankName: 'Bank',
          accountNumber: null,
        };
        const res2 = internals.mapPersonalProfile('staff-1', partialProfile2);
        expect(res2.address?.line1).toBe('Line 1');
        expect(res2.address?.city).toBeUndefined();
        expect(res2.address?.country).toBe('US');
        expect(res2.emergencyContact?.name).toBe('Jane');
        expect(res2.emergencyContact?.phone).toBeUndefined();
        expect(res2.bankDetails?.bankName).toBe('Bank');
        expect(res2.bankDetails?.accountNumber).toBeUndefined();

        // Exercise recordAuditEvent with undefined user and tenant
        await internals.recordAuditEvent(undefined, undefined, 'TestFallback', 'target-x');
      });

      it('handles user role extraction and self-checks with edge cases', async () => {
        // User with no roles
        const userNoRoles = user({ id: 'user-no-role', roles: [] });
        (userNoRoles as { roles?: unknown }).roles = undefined;
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce({ ...baseStaff, branches: undefined });
        await expect(service.getStaffPersonalDetails({ user: userNoRoles }, 'staff-1')).rejects.toBeInstanceOf(ForbiddenException);

        // User with object roles with undefined name
        const userObjRole = user({ id: 'user-obj', roles: [{ id: 'role-1' }] as unknown as string[] });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(service.getStaffPersonalDetails({ user: userObjRole }, 'staff-1')).rejects.toBeInstanceOf(ForbiddenException);

        // Staff matched by email for self access
        const emailStaffUser = user({ id: 'user-diff-id', email: 'stylist@salon.test', roles: [] });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce({
          ...baseStaff,
          userId: 'diff-user-id',
          email: 'stylist@salon.test',
          profile: mockProfile,
        });
        const emailSelfDetails = await service.getStaffPersonalDetails({ user: emailStaffUser }, 'staff-1');
        expect(emailSelfDetails.staffId).toBe('staff-1');

        // Manager with empty managedBranchIds and canManageBranches false
        const managerNoScope = user({ id: 'mgr-1', roles: ['BRANCH_MANAGER'], managedBranchIds: [], canManageBranches: false });
        prisma.salonOwnerStaff.findFirst.mockResolvedValueOnce(baseStaff);
        await expect(service.getStaffPersonalDetails({ user: managerNoScope }, 'staff-1')).rejects.toBeInstanceOf(ForbiddenException);
      });
    });
  });
});
