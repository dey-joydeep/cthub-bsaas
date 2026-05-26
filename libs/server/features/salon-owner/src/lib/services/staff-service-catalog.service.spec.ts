import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

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
    eligibleStaff: [],
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
  const prisma = {
    salonBusiness: {
      findFirst: jest.fn(),
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
    salonOwnerServiceStaffEligibility: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma)),
  };
  return prisma;
}

describe('StaffServiceCatalogService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: StaffServiceCatalogService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new StaffServiceCatalogService(prisma as unknown as PrismaService);
  });

  it('lists staff by authenticated tenant and optional branch', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerStaff.findMany.mockResolvedValue([staff()]);

    const result = await service.listStaff({ user: user() }, 'branch-1');

    expect(prisma.salonOwnerStaff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          business: { tenantId: 'tenant-1' },
          branches: { some: { branchId: 'branch-1' } },
        }),
      }),
    );
    expect(result.items[0]).toMatchObject({ id: 'staff-1', branchIds: ['branch-1'] });
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

  it('rejects staff assignments across businesses', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findMany.mockResolvedValue([branch({ id: 'branch-1' }), branch({ id: 'branch-2', businessId: 'business-2' })]);

    await expect(
      service.updateStaff(
        { user: user() },
        'staff-1',
        { branchIds: ['branch-1', 'branch-2'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' },
      ),
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
      service.replaceStaffShifts(
        { user: user() },
        'staff-1',
        { branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [{ dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] }] },
      ),
    ).resolves.toMatchObject({ staffId: 'staff-1', branchId: 'branch-1' });
    await expect(
      service.createStaffLeaveBlock(
        { user: user() },
        'staff-1',
        { branchId: 'branch-1', startsAt: '2026-05-26T01:00:00.000Z', endsAt: '2026-05-26T02:00:00.000Z', reason: ' Personal ' },
      ),
    ).resolves.toMatchObject({ id: 'leave-1', reason: 'Personal' });
  });

  it('rejects invalid shift and leave intervals', async () => {
    prisma.salonOwnerStaff.findFirst.mockResolvedValue(staff());
    prisma.salonBranch.findFirst.mockResolvedValue(branch());

    await expect(
      service.replaceStaffShifts(
        { user: user() },
        'staff-1',
        { branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [{ dayOfWeek: 1, intervals: [{ start: '17:00', end: '09:00' }] }] },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.createStaffLeaveBlock(
        { user: user() },
        'staff-1',
        { branchId: 'branch-1', startsAt: '2026-05-26T02:00:00.000Z', endsAt: '2026-05-26T01:00:00.000Z', reason: 'Personal' },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('creates categories and maps duplicates to conflict', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
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
    prisma.salonBusiness.findFirst.mockResolvedValueOnce(business());
    prisma.salonOwnerServiceCategory.findMany.mockResolvedValue([category()]);

    await expect(service.listServiceCategories({ user: user() })).resolves.toMatchObject({ items: [{ id: 'category-1' }] });

    prisma.salonBusiness.findFirst.mockResolvedValueOnce(null);
    await expect(service.listServiceCategories({ user: user() })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates, updates, and statuses services under the default business', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
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

  it('lists services by category and replaces service staff eligibility', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonOwnerServiceCategory.findFirst.mockResolvedValue(category());
    prisma.salonOwnerService.findMany.mockResolvedValue([serviceRecord()]);
    prisma.salonOwnerService.findFirst.mockResolvedValue(serviceRecord());
    prisma.salonOwnerStaff.count.mockResolvedValue(1);
    prisma.salonOwnerService.findUniqueOrThrow.mockResolvedValue(serviceRecord({ eligibleStaff: [{ serviceId: 'service-1', staffId: 'staff-1' }] }));

    await expect(service.listServices({ user: user() }, 'category-1')).resolves.toMatchObject({ items: [{ id: 'service-1' }] });
    await expect(
      service.replaceServiceStaffEligibility({ user: user() }, 'service-1', { staffIds: ['staff-1', 'staff-1'] }),
    ).resolves.toMatchObject({ eligibleStaffIds: ['staff-1'] });
  });
});
