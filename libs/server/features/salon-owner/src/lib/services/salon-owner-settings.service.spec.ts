import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { SalonOwnerSettingsService } from './salon-owner-settings.service';

const now = new Date('2026-05-26T00:00:00.000Z');

interface BranchCreateArgs {
  readonly data: {
    readonly businessId: string;
    readonly name: string;
    readonly currency: string;
    readonly address: {
      readonly country: string;
    };
  };
}

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
    address: {
      line1: '1 Main St',
      city: 'Tokyo',
      state: 'Tokyo',
      postalCode: '1000001',
      country: 'JP',
    },
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
  return {
    salonBusiness: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    salonBranch: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    salonBranchHours: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    salonBranchHoliday: {
      upsert: jest.fn(),
    },
    salonBranchPolicy: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('SalonOwnerSettingsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SalonOwnerSettingsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SalonOwnerSettingsService(prisma as unknown as PrismaService);
  });

  it('lists businesses for the authenticated tenant', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);

    const result = await service.listBusinesses({ user: user() });

    expect(prisma.salonBusiness.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { createdAt: 'asc' },
    });
    expect(result.items[0]).toMatchObject({ id: 'business-1', tenantId: 'tenant-1' });
    expect(result.page).toEqual({ limit: 1, nextCursor: null, hasMore: false });
  });

  it('requires tenant scope from the authenticated token', async () => {
    await expect(service.listBusinesses({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a business and maps duplicate names to conflict', async () => {
    prisma.salonBusiness.create.mockResolvedValue(business({ displayName: 'Trimmed' }));

    await expect(
      service.createBusiness(
        { user: user() },
        {
          displayName: ' Trimmed ',
          legalName: ' Legal ',
          status: 'ACTIVE',
        },
      ),
    ).resolves.toMatchObject({ displayName: 'Trimmed' });

    expect(prisma.salonBusiness.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        displayName: 'Trimmed',
        legalName: 'Legal',
        status: 'ACTIVE',
      },
    });

    prisma.salonBusiness.create.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(
      service.createBusiness({ user: user() }, { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates only an in-scope business', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBusiness.update.mockResolvedValue(business({ status: 'INACTIVE' }));

    await expect(
      service.updateBusiness({ user: user() }, 'business-1', {
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'INACTIVE',
      }),
    ).resolves.toMatchObject({ status: 'INACTIVE' });

    prisma.salonBusiness.findFirst.mockResolvedValueOnce(null);
    await expect(service.getBusiness({ user: user() }, 'missing-business')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates branches after validating business scope and normalizing address', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ name: 'Downtown' }));

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: ' Downtown ',
          phone: ' 555 ',
          email: ' branch@example.com ',
          timezone: 'Asia/Tokyo',
          currency: 'jpy',
          address: {
            line1: ' 1 Main St ',
            city: ' Tokyo ',
            state: ' Tokyo ',
            postalCode: ' 1000001 ',
            country: 'jp',
          },
        },
      ),
    ).resolves.toMatchObject({ name: 'Downtown', currency: 'JPY' });

    const [createArgs] = prisma.salonBranch.create.mock.calls[0] as [BranchCreateArgs];
    expect(createArgs.data.businessId).toBe('business-1');
    expect(createArgs.data.name).toBe('Downtown');
    expect(createArgs.data.currency).toBe('JPY');
    expect(createArgs.data.address.country).toBe('JP');
  });

  it('blocks branch updates that try to move a branch across businesses', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ businessId: 'business-1' }));

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-2',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('replaces weekly hours atomically', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBranchHours.deleteMany.mockReturnValue('delete-op');
    prisma.salonBranchHours.createMany.mockReturnValue('create-op');
    prisma.$transaction.mockResolvedValue(['deleted', 'created']);

    const days = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      open: dayOfWeek !== 0,
      intervals: dayOfWeek === 0 ? [] : [{ start: '09:00', end: '17:00' }],
    }));

    const result = await service.replaceBranchHours({ user: user() }, 'branch-1', {
      timezone: 'Asia/Tokyo',
      days,
    });

    expect(result.days).toHaveLength(7);
    expect(prisma.$transaction).toHaveBeenCalledWith(['delete-op', 'create-op']);
  });

  it('rejects invalid hours and holiday intervals', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [
          { dayOfWeek: 0, open: true, intervals: [] },
          { dayOfWeek: 1, open: false, intervals: [] },
          { dayOfWeek: 2, open: false, intervals: [] },
          { dayOfWeek: 3, open: false, intervals: [] },
          { dayOfWeek: 4, open: false, intervals: [] },
          { dayOfWeek: 5, open: false, intervals: [] },
          { dayOfWeek: 6, open: false, intervals: [] },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.setBranchHoliday({ user: user() }, 'branch-1', '2026-05-26', {
        closed: false,
        intervals: [{ start: '12:00', end: '11:00' }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.setBranchHoliday({ user: user() }, 'branch-1', '2026-02-31', {
        closed: true,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('upserts holidays and branch policy', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBranchHoliday.upsert.mockResolvedValue({
      id: 'holiday-1',
      branchId: 'branch-1',
      date: new Date('2026-05-26T00:00:00.000Z'),
      closed: true,
      reason: 'Maintenance',
      intervals: [],
      createdAt: now,
      updatedAt: now,
    });
    prisma.salonBranchPolicy.upsert.mockResolvedValue({
      branchId: 'branch-1',
      bookingLeadMinutes: 30,
      cancellationCutoffMinutes: 120,
      noShowGraceMinutes: 10,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      service.setBranchHoliday({ user: user() }, 'branch-1', '2026-05-26', { closed: true, reason: ' Maintenance ' }),
    ).resolves.toMatchObject({ date: '2026-05-26', reason: 'Maintenance' });

    await expect(
      service.updateBranchPolicy({ user: user() }, 'branch-1', {
        bookingLeadMinutes: 30,
        cancellationCutoffMinutes: 120,
        noShowGraceMinutes: 10,
      }),
    ).resolves.toEqual({
      branchId: 'branch-1',
      bookingLeadMinutes: 30,
      cancellationCutoffMinutes: 120,
      noShowGraceMinutes: 10,
    });
  });
});
