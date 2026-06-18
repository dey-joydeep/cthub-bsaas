import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';
import { createHash } from 'crypto';

import { SalonOwnerSettingsService } from './salon-owner-settings.service';

const now = new Date('2026-05-26T00:00:00.000Z');

interface BranchCreateArgs {
  readonly data: {
    readonly businessId: string;
    readonly name: string;
    readonly currency: string;
    readonly status: string;
    readonly address: {
      readonly country: string;
    };
  };
}

interface BranchUpdateArgs {
  readonly where: {
    readonly id: string;
  };
  readonly data: Record<string, unknown>;
}

interface HolidayUpsertArgs {
  readonly update: {
    readonly reason: string | null;
  };
}

interface AuditCreateArgs {
  readonly data: {
    readonly tenantId: string;
    readonly action: string;
    readonly result?: string;
    readonly targetId?: string;
  };
}

interface SalonUpsertArgs {
  readonly where: {
    readonly id: string;
  };
  readonly create: {
    readonly id: string;
    readonly tenant: {
      readonly connect: {
        readonly id: string;
      };
    };
    readonly owner: {
      readonly connect: {
        readonly id: string;
      };
    };
    readonly name: string;
    readonly slug: string;
    readonly phone: string | null;
    readonly email: string | null;
    readonly isActive: boolean;
    readonly metadata?: Record<string, unknown>;
    readonly businessAddress?: {
      readonly create: {
        readonly state: {
          readonly connect: {
            readonly id: string;
          };
        };
      };
    };
  };
  readonly update: {
    readonly tenant: {
      readonly connect: {
        readonly id: string;
      };
    };
    readonly owner: {
      readonly connect: {
        readonly id: string;
      };
    };
    readonly name: string;
    readonly slug?: string;
    readonly phone: string | null;
    readonly email: string | null;
    readonly isActive: boolean;
    readonly metadata?: Record<string, unknown>;
    readonly businessAddress?: Record<string, unknown>;
  };
}

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
    status: 'ACTIVE',
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

function translatedUniqueConstraintError(): Error {
  return new Error('A unique constraint was violated');
}

function hashIdempotencyPayload(input: unknown): string {
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((entry) => canonicalize(entry));
    }

    if (value && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => {
          result[key] = canonicalize((value as Record<string, unknown>)[key]);
          return result;
        }, {});
    }

    return value;
  };

  return createHash('sha256')
    .update(JSON.stringify(canonicalize(input)))
    .digest('hex');
}

function createPrismaMock() {
  return {
    salonBusiness: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    salonBranch: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
    },
    salonBranchHours: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
    salonBranchHoliday: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    salonBranchPolicy: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    salon: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    country: {
      findUnique: jest.fn(),
    },
    state: {
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    saasOwner: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

function expectAuditCall(
  calls: readonly [AuditCreateArgs][],
  expected: { tenantId?: string; action: string; result?: string; targetId?: string },
): void {
  expect(
    calls.some(([arg]) => {
      return (
        arg.data.action === expected.action &&
        (expected.tenantId === undefined || arg.data.tenantId === expected.tenantId) &&
        (expected.result === undefined || arg.data.result === expected.result) &&
        (expected.targetId === undefined || arg.data.targetId === expected.targetId)
      );
    }),
  ).toBe(true);
}

describe('SalonOwnerSettingsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: SalonOwnerSettingsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SalonOwnerSettingsService(prisma as unknown as PrismaService);
    prisma.country.findUnique.mockResolvedValue({ id: 'country-1' });
    prisma.state.findFirst.mockResolvedValue({ id: 'state-1' });
    prisma.city.findFirst.mockResolvedValue({ id: 'city-1' });
    prisma.salon.upsert.mockResolvedValue({ id: 'branch-1' });
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return await arg(prisma as unknown as PrismaService);
      }
      return [];
    });
  });

  it('lists businesses for the authenticated tenant', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonBusiness.count.mockResolvedValue(1);

    const result = await service.listBusinesses({ user: user() });

    expect(prisma.salonBusiness.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 25,
    });
    expect(result.items[0]).toMatchObject({ id: 'business-1', tenantId: 'tenant-1' });
    expect(result.page).toEqual({ pageNumber: 1, limit: 25, totalItems: 1, nextCursor: null, hasMore: false });
  });

  it('keeps empty business pagination metadata schema-valid', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([]);
    prisma.salonBusiness.count.mockResolvedValue(0);

    await expect(service.listBusinesses({ user: user() })).resolves.toEqual({
      items: [],
      page: { pageNumber: 1, limit: 25, totalItems: 0, nextCursor: null, hasMore: false },
    });
  });

  it('lists businesses across managed tenant scope for platform admins', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business({ tenantId: 'tenant-2' })]);
    prisma.salonBusiness.count.mockResolvedValue(1);

    await expect(
      service.listBusinesses({
        user: user({
          tenantId: undefined,
          roles: [UserRole.ADMIN],
          managedTenants: ['tenant-2', 'tenant-3'],
        }),
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ tenantId: 'tenant-2' })],
    });

    expect(prisma.salonBusiness.findMany).toHaveBeenCalledWith({
      where: { tenantId: { in: ['tenant-2', 'tenant-3'] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 25,
    });
  });

  it('reads managed tenant scope from the nested saas owner payload', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business({ tenantId: 'tenant-9' })]);
    prisma.salonBusiness.count.mockResolvedValue(1);

    await expect(
      service.listBusinesses({
        user: user({
          tenantId: undefined,
          roles: [UserRole.ADMIN],
          saasOwner: { managedTenants: ['tenant-9', 'tenant-10'] },
        }),
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ tenantId: 'tenant-9' })],
    });

    expect(prisma.salonBusiness.findMany).toHaveBeenCalledWith({
      where: { tenantId: { in: ['tenant-9', 'tenant-10'] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 25,
    });
    expect(prisma.saasOwner.findUnique).not.toHaveBeenCalled();
  });

  it('loads managed tenant scope from the persisted saas owner record when auth context omits it', async () => {
    prisma.saasOwner.findUnique.mockResolvedValue({ managedTenants: ['tenant-4', 'tenant-5', 'tenant-4'] });
    prisma.salonBusiness.findMany.mockResolvedValue([business({ tenantId: 'tenant-4' })]);
    prisma.salonBusiness.count.mockResolvedValue(1);

    await expect(
      service.listBusinesses({
        user: user({
          tenantId: undefined,
          roles: [UserRole.ADMIN],
        }),
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ tenantId: 'tenant-4' })],
    });

    expect(prisma.saasOwner.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { managedTenants: true },
    });
    expect(prisma.salonBusiness.findMany).toHaveBeenCalledWith({
      where: { tenantId: { in: ['tenant-4', 'tenant-5'] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 25,
    });
  });

  it('rejects admin scope when nested saas owner data does not carry managed tenants', async () => {
    prisma.saasOwner.findUnique.mockResolvedValue(null);

    await expect(
      service.listBusinesses({
        user: user({
          tenantId: undefined,
          roles: [UserRole.ADMIN],
          saasOwner: [],
        }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires tenant scope from the authenticated token', async () => {
    await expect(service.listBusinesses({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.saasOwner.findUnique).not.toHaveBeenCalled();
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
    expectAuditCall(prisma.auditEvent.create.mock.calls as [AuditCreateArgs][], {
      tenantId: 'tenant-1',
      action: 'salon_owner.business.create',
      result: 'success',
      targetId: 'business-1',
    });

    prisma.salonBusiness.create.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(
      service.createBusiness({ user: user() }, { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonBusiness.create.mockRejectedValueOnce(translatedUniqueConstraintError());
    await expect(
      service.createBusiness({ user: user() }, { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('replays a previously created business when the same idempotency key is reused', async () => {
    const input = {
      displayName: 'Salon One',
      legalName: 'Salon One Legal',
      status: 'ACTIVE' as const,
    };
    prisma.auditEvent.findFirst.mockResolvedValue({
      reason: `${hashIdempotencyPayload(input)}:business-1`,
    });
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(service.createBusiness({ user: user(), idempotencyKey: 'idem-1' }, input)).resolves.toMatchObject({
      id: 'business-1',
    });

    expect(prisma.salonBusiness.create).not.toHaveBeenCalled();
  });

  it('replays a business after a post-commit retry race in the catch path', async () => {
    const input = {
      displayName: 'Salon One',
      legalName: 'Salon One Legal',
      status: 'ACTIVE' as const,
    };
    prisma.salonBusiness.create.mockRejectedValue(new Error('write lost'));
    prisma.auditEvent.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      reason: `${hashIdempotencyPayload(input)}:business-1`,
    });
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(service.createBusiness({ user: user(), idempotencyKey: 'idem-1' }, input)).resolves.toMatchObject({
      id: 'business-1',
    });
  });

  it('rejects business replay when the same idempotency key is reused with a different payload', async () => {
    prisma.auditEvent.findFirst.mockResolvedValue({
      reason: 'different-hash:business-1',
    });

    await expect(
      service.createBusiness(
        { user: user(), idempotencyKey: 'idem-1' },
        { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects business names that are too short after trimming', async () => {
    await expect(
      service.createBusiness(
        { user: user() },
        {
          displayName: ' A ',
          legalName: ' Legal ',
          status: 'ACTIVE',
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.salonBusiness.create).not.toHaveBeenCalled();
  });

  it('updates only an in-scope business', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.count.mockResolvedValue(0);
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
    expectAuditCall(prisma.auditEvent.create.mock.calls as [AuditCreateArgs][], {
      tenantId: 'tenant-1',
      action: 'salon_owner.business.update',
      targetId: 'business-1',
    });
  });

  it('rejects business creation when the authenticated scope spans multiple tenants', async () => {
    await expect(
      service.createBusiness(
        {
          user: user({
            tenantId: undefined,
            roles: [UserRole.ADMIN],
            managedTenants: ['tenant-1', 'tenant-2'],
          }),
        },
        { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks deactivating a business while active branches remain', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business({ status: 'ACTIVE' }));
    prisma.salonBranch.count.mockResolvedValue(2);

    await expect(
      service.updateBusiness({ user: user() }, 'business-1', {
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'INACTIVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.salonBusiness.update).not.toHaveBeenCalled();
  });

  it('surfaces not-found and duplicate update failures for business updates', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValueOnce(business());
    prisma.salonBusiness.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.updateBusiness({ user: user() }, 'business-1', {
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBusiness.update.mockRejectedValueOnce(prismaKnownError('P2002'));

    await expect(
      service.updateBusiness({ user: user() }, 'business-1', {
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBusiness.update.mockRejectedValueOnce(translatedUniqueConstraintError());

    await expect(
      service.updateBusiness({ user: user() }, 'business-1', {
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists branches with and without an explicit business filter', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.salonBranch.count.mockResolvedValue(1);
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(service.listBranches({ user: user() })).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'branch-1' })],
    });
    await expect(service.listBranches({ user: user() }, 'business-1')).resolves.toMatchObject({
      items: [expect.objectContaining({ businessId: 'business-1' })],
    });
  });

  it('applies branch status and search filters before pagination', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.findMany.mockResolvedValue([branch({ name: 'Downtown' })]);
    prisma.salonBranch.count.mockResolvedValue(1);

    await expect(
      service.listBranches({ user: user() }, 'business-1', { status: 'ACTIVE', q: '  town ' }, { page: 1, pageSize: 10 }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ name: 'Downtown' })],
    });

    expect(prisma.salonBranch.findMany).toHaveBeenCalledWith({
      where: {
        businessId: 'business-1',
        status: 'ACTIVE',
        name: { contains: 'town', mode: 'insensitive' },
        business: { tenantId: 'tenant-1' },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 10,
    });
  });

  it('applies page and pageSize to business and branch listings', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonBusiness.count.mockResolvedValue(3);
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.salonBranch.count.mockResolvedValue(4);
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(service.listBusinesses({ user: user() }, { page: 2, pageSize: 2 })).resolves.toMatchObject({
      page: { pageNumber: 2, limit: 2, totalItems: 3, hasMore: false },
    });
    expect(prisma.salonBusiness.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 2,
      take: 2,
    });

    await expect(service.listBranches({ user: user() }, 'business-1', {}, { page: 1, pageSize: 3 })).resolves.toMatchObject({
      page: { pageNumber: 1, limit: 3, totalItems: 4, hasMore: true },
    });
    expect(prisma.salonBranch.findMany).toHaveBeenCalledWith({
      where: { businessId: 'business-1', business: { tenantId: 'tenant-1' } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 3,
    });
  });

  it('rejects invalid settings list pagination values', async () => {
    await expect(service.listBusinesses({ user: user() }, { page: 0 })).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(service.listBranches({ user: user() }, undefined, {}, { pageSize: 101 })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('creates branches after validating business scope and normalizing address', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(
      branch({ name: 'Downtown', status: 'INACTIVE', phone: '555', email: 'branch@example.com' }),
    );

    await expect(
      service.createBranch(
        { user: user(), idempotencyKey: 'idem-create-branch' },
        {
          businessId: 'business-1',
          name: ' Downtown ',
          phone: ' 555 ',
          email: ' branch@example.com ',
          timezone: 'Asia/Tokyo',
          currency: 'jpy',
          status: 'INACTIVE',
          address: {
            line1: ' 1 Main St ',
            city: ' Tokyo ',
            state: ' Tokyo ',
            postalCode: ' 1000001 ',
            country: 'jp',
          },
        },
      ),
    ).resolves.toMatchObject({ name: 'Downtown', currency: 'JPY', status: 'INACTIVE' });

    const [createArgs] = prisma.salonBranch.create.mock.calls[0] as [BranchCreateArgs];
    expect(createArgs.data.businessId).toBe('business-1');
    expect(createArgs.data.name).toBe('Downtown');
    expect(createArgs.data.currency).toBe('JPY');
    expect(createArgs.data.status).toBe('INACTIVE');
    expect(createArgs.data.address.country).toBe('JP');
    const [salonUpsertArgs] = prisma.salon.upsert.mock.calls[0] as [SalonUpsertArgs];
    expect(salonUpsertArgs.where).toEqual({ id: 'branch-1' });
    expect(salonUpsertArgs.create).toMatchObject({
      id: 'branch-1',
      tenant: { connect: { id: 'tenant-1' } },
      owner: { connect: { id: 'user-1' } },
      name: 'Downtown',
      slug: 'downtown-branch-1',
      phone: '555',
      email: 'branch@example.com',
      isActive: false,
    });
    expectAuditCall(prisma.auditEvent.create.mock.calls as [AuditCreateArgs][], {
      tenantId: 'tenant-1',
      action: 'salon_owner.branch.create',
      targetId: 'branch-1',
    });
  });

  it('rejects branch creation under an inactive business', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business({ status: 'INACTIVE' }));

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.salonBranch.create).not.toHaveBeenCalled();
  });

  it('inherits the operational salon owner from the migrated business root when creating a new branch', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ id: 'branch-2', name: 'Downtown' }));
    prisma.salon.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ ownerId: 'owner-2' });

    await service.createBranch(
      { user: user({ roles: [UserRole.ADMIN] }) },
      {
        businessId: 'business-1',
        name: 'Downtown',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      },
    );

    const [salonUpsertArgs] = prisma.salon.upsert.mock.calls[0] as [SalonUpsertArgs];
    expect(salonUpsertArgs.create.owner.connect.id).toBe('owner-2');
  });

  it('falls back to the tenant owner when an admin creates a branch without a migrated business root salon', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ id: 'branch-2', name: 'Downtown' }));
    prisma.salon.findUnique.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({ id: 'owner-3' });

    await service.createBranch(
      { user: user({ roles: [UserRole.ADMIN], tenantId: undefined, managedTenants: ['tenant-1'] }) },
      {
        businessId: 'business-1',
        name: 'Downtown',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      },
    );

    const [salonUpsertArgs] = prisma.salon.upsert.mock.calls[0] as [SalonUpsertArgs];
    expect(salonUpsertArgs.create.owner.connect.id).toBe('owner-3');
    const [userFindArgs] = prisma.user.findFirst.mock.calls[0] as [
      {
        readonly where: {
          readonly roles: {
            readonly some: {
              readonly role: {
                readonly name: {
                  readonly in: string[];
                };
              };
            };
          };
        };
      },
    ];
    expect(userFindArgs.where.roles.some.role.name.in).toEqual(['owner', 'OWNER']);
  });

  it('rejects branch creation when no operational owner can be resolved', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ id: 'branch-2', name: 'Downtown' }));
    prisma.salon.findUnique.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.createBranch(
        { user: user({ roles: [UserRole.ADMIN], tenantId: undefined, managedTenants: ['tenant-1'] }) },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates missing state and city records when the branch address is new to master data', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(
      branch({
        id: 'branch-2',
        name: 'Downtown',
        address: {
          line1: '1 Main St',
          city: 'Shibuya',
          state: 'Tokyo Metropolis',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    );
    prisma.state.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'state-2' });
    prisma.state.createMany.mockResolvedValue({ count: 1 });
    prisma.city.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'city-2' });
    prisma.city.createMany.mockResolvedValue({ count: 1 });

    await service.createBranch(
      { user: user() },
      {
        businessId: 'business-1',
        name: 'Downtown',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Shibuya',
          state: 'Tokyo Metropolis',
          postalCode: '1000001',
          country: 'JP',
        },
      },
    );

    const [stateCreateManyArgs] = prisma.state.createMany.mock.calls[0] as [
      {
        data: Array<{ countryId: string; name: string; stateCode: string }>;
        skipDuplicates: boolean;
      },
    ];
    expect(stateCreateManyArgs.skipDuplicates).toBe(true);
    expect(stateCreateManyArgs.data).toHaveLength(1);
    expect(stateCreateManyArgs.data[0]).toMatchObject({
      countryId: 'country-1',
      name: 'Tokyo Metropolis',
    });
    expect(stateCreateManyArgs.data[0].stateCode).toMatch(/^TOKYOMET-\w{4}$/);
    expect(prisma.city.createMany).toHaveBeenCalledWith({
      data: [
        {
          countryId: 'country-1',
          stateId: 'state-2',
          name: 'Shibuya',
        },
      ],
      skipDuplicates: true,
    });
  });

  it('recovers from a concurrent state create collision and reuses the winner row', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ id: 'branch-2', name: 'Downtown' }));
    prisma.state.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'state-2' });
    prisma.state.createMany.mockResolvedValue({ count: 0 });

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo Metropolis',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).resolves.toMatchObject({ id: 'branch-2' });

    expect(prisma.state.createMany).toHaveBeenCalledTimes(1);
    const [salonUpsertArgs] = prisma.salon.upsert.mock.calls[0] as [SalonUpsertArgs];
    expect(salonUpsertArgs.create.businessAddress?.create.state.connect.id).toBe('state-2');
  });

  it('recovers from a concurrent city create collision and reuses the winner row', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(
      branch({
        id: 'branch-2',
        name: 'Downtown',
        address: {
          line1: '1 Main St',
          city: 'Shibuya',
          state: 'Tokyo Metropolis',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    );
    prisma.state.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'state-2' });
    prisma.state.createMany.mockResolvedValue({ count: 1 });
    prisma.city.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'city-2' });
    prisma.city.createMany.mockResolvedValue({ count: 0 });

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Shibuya',
            state: 'Tokyo Metropolis',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).resolves.toMatchObject({ id: 'branch-2' });

    expect(prisma.city.createMany).toHaveBeenCalledTimes(1);
  });

  it('propagates master-data insert failures and surfaces an explicit conflict when no winner row appears', async () => {
    const nonUniqueStateError = new Error('state write failed');
    prisma.state.findFirst.mockResolvedValueOnce(null);
    prisma.state.createMany.mockRejectedValueOnce(nonUniqueStateError);

    await expect(
      (
        service as unknown as {
          resolveState(prismaArg: typeof prisma, countryId: string, stateName: string): Promise<unknown>;
        }
      ).resolveState(prisma as never, 'country-1', 'Tokyo Metropolis'),
    ).rejects.toBe(nonUniqueStateError);

    prisma.state.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.state.createMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      (
        service as unknown as {
          resolveState(prismaArg: typeof prisma, countryId: string, stateName: string): Promise<unknown>;
        }
      ).resolveState(prisma as never, 'country-1', 'Tokyo Metropolis'),
    ).rejects.toBeInstanceOf(ConflictException);

    const nonUniqueCityError = new Error('city write failed');
    prisma.city.findFirst.mockResolvedValueOnce(null);
    prisma.city.createMany.mockRejectedValueOnce(nonUniqueCityError);

    await expect(
      (
        service as unknown as {
          resolveCity(prismaArg: typeof prisma, countryId: string, stateId: string, cityName: string): Promise<unknown>;
        }
      ).resolveCity(prisma as never, 'country-1', 'state-1', 'Shibuya'),
    ).rejects.toBe(nonUniqueCityError);

    prisma.city.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.city.createMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      (
        service as unknown as {
          resolveCity(prismaArg: typeof prisma, countryId: string, stateId: string, cityName: string): Promise<unknown>;
        }
      ).resolveCity(prisma as never, 'country-1', 'state-1', 'Shibuya'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('loads stored branch hours, holidays, and policy', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBranchHours.findMany.mockResolvedValue([
      {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        dayOfWeek: 0,
        open: false,
        intervals: [],
      },
      {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        dayOfWeek: 1,
        open: true,
        intervals: [{ start: '09:00', end: '17:00' }],
      },
    ]);
    prisma.salonBranchHoliday.findMany.mockResolvedValue([
      {
        branchId: 'branch-1',
        date: new Date('2026-05-26T00:00:00.000Z'),
        closed: true,
        reason: 'Holiday',
        intervals: [],
      },
    ]);
    prisma.salonBranchPolicy.findUnique.mockResolvedValue({
      branchId: 'branch-1',
      bookingLeadMinutes: 30,
      cancellationCutoffMinutes: 120,
      noShowGraceMinutes: 10,
    });

    await expect(service.getBranchHours({ user: user() }, 'branch-1')).resolves.toEqual({
      branchId: 'branch-1',
      timezone: 'Asia/Tokyo',
      days: [
        { dayOfWeek: 0, open: false, intervals: [] },
        { dayOfWeek: 1, open: true, intervals: [{ start: '09:00', end: '17:00' }] },
      ],
    });
    await expect(service.listBranchHolidays({ user: user() }, 'branch-1')).resolves.toEqual({
      items: [
        {
          branchId: 'branch-1',
          date: '2026-05-26',
          closed: true,
          reason: 'Holiday',
          intervals: [],
        },
      ],
    });
    await expect(service.getBranchPolicy({ user: user() }, 'branch-1')).resolves.toEqual({
      branchId: 'branch-1',
      bookingLeadMinutes: 30,
      cancellationCutoffMinutes: 120,
      noShowGraceMinutes: 10,
    });
  });

  it('returns a closed weekly-hours skeleton when a branch has no stored hours yet', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBranchHours.findMany.mockResolvedValue([]);

    await expect(service.getBranchHours({ user: user() }, 'branch-1')).resolves.toEqual({
      branchId: 'branch-1',
      timezone: 'Asia/Tokyo',
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        open: false,
        intervals: [],
      })),
    });
  });

  it('returns a default branch policy object when no override has been stored yet', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBranchPolicy.findUnique.mockResolvedValue(null);

    await expect(service.getBranchPolicy({ user: user() }, 'branch-1')).resolves.toEqual({
      branchId: 'branch-1',
      bookingLeadMinutes: 0,
      cancellationCutoffMinutes: 0,
      noShowGraceMinutes: 0,
    });
  });

  it('rejects branch creation when the address country is missing from master data', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ id: 'branch-2', name: 'Downtown' }));
    prisma.country.findUnique.mockResolvedValue(null);

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('replays branch creation before applying the inactive-business check', async () => {
    const input = {
      businessId: 'business-1',
      name: 'Downtown',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE' as const,
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    };
    prisma.salonBusiness.findFirst.mockResolvedValue(business({ status: 'INACTIVE' }));
    prisma.auditEvent.findFirst.mockResolvedValue({
      reason: `${hashIdempotencyPayload(input)}:branch-1`,
    });
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ name: 'Downtown' }));

    await expect(service.createBranch({ user: user(), idempotencyKey: 'idem-1' }, input)).resolves.toMatchObject({
      id: 'branch-1',
      name: 'Downtown',
    });

    expect(prisma.salonBranch.create).not.toHaveBeenCalled();
  });

  it('replays a branch after a post-commit retry race in the catch path', async () => {
    const input = {
      businessId: 'business-1',
      name: 'Downtown',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE' as const,
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    };
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockRejectedValue(new Error('write lost'));
    prisma.auditEvent.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      reason: `${hashIdempotencyPayload(input)}:branch-1`,
    });
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ name: 'Downtown' }));

    await expect(service.createBranch({ user: user(), idempotencyKey: 'idem-1' }, input)).resolves.toMatchObject({
      id: 'branch-1',
    });
  });

  it('surfaces branch creation not-found and duplicate failures', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockRejectedValueOnce(prismaKnownError('P2002'));

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockRejectedValueOnce(translatedUniqueConstraintError());

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Downtown',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects branch names that are too short after trimming', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: ' A ',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.salonBranch.create).not.toHaveBeenCalled();
  });

  it('rejects unsupported branch currencies', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Main Branch',
          timezone: 'Asia/Tokyo',
          currency: 'ZZZ',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects invalid branch timezone and address country inputs', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Main Branch',
          timezone: 'Mars/Base',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JP',
          },
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.createBranch(
        { user: user() },
        {
          businessId: 'business-1',
          name: 'Main Branch',
          timezone: 'Asia/Tokyo',
          currency: 'JPY',
          status: 'ACTIVE',
          address: {
            line1: '1 Main St',
            city: 'Tokyo',
            state: 'Tokyo',
            postalCode: '1000001',
            country: 'JPN',
          },
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('gets a branch and reports missing branches', async () => {
    prisma.salonBranch.findFirst.mockResolvedValueOnce(branch({ phone: null, email: null }));

    const result = await service.getBranch({ user: user() }, 'branch-1');
    expect(result.id).toBe('branch-1');
    expect(result).not.toHaveProperty('phone');
    expect(result).not.toHaveProperty('email');

    prisma.salonBranch.findFirst.mockResolvedValueOnce(null);
    await expect(service.getBranch({ user: user() }, 'missing-branch')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks branch updates that try to move a branch across businesses', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ businessId: 'business-1' }));

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-2',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
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

  it('clears branch contact fields when the update omits them', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ phone: '123', email: 'branch@example.com' }));
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.update.mockResolvedValue(branch({ phone: null, email: null }));

    await service.updateBranch({ user: user() }, 'branch-1', {
      businessId: 'business-1',
      name: 'Main Branch',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE',
      phone: '   ',
      email: '   ',
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    });

    const [updateArgs] = prisma.salonBranch.update.mock.calls[0] as [BranchUpdateArgs];
    expect(updateArgs.where).toEqual({ id: 'branch-1' });
    expect(updateArgs.data['phone']).toBeNull();
    expect(updateArgs.data['email']).toBeNull();
    expect(updateArgs.data['id']).toBeUndefined();
  });

  it('preserves branch contact fields when patch omits them entirely', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ phone: '123', email: 'branch@example.com' }));
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.update.mockResolvedValue(branch());

    await service.updateBranch({ user: user() }, 'branch-1', {
      businessId: 'business-1',
      name: 'Main Branch',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE',
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    });

    const [updateArgs] = prisma.salonBranch.update.mock.calls[0] as [Record<string, unknown>];
    const data = updateArgs['data'] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(data, 'phone')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(data, 'email')).toBe(false);
  });

  it('blocks reactivating a branch beneath an inactive business', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ status: 'INACTIVE' }));
    prisma.salonBusiness.findFirst.mockResolvedValue(business({ status: 'INACTIVE' }));

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.update.mockRejectedValueOnce(translatedUniqueConstraintError());

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks branch archival while future confirmed appointments still reference the operational branch', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ status: 'ACTIVE' }));
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.appointment.count.mockResolvedValue(2);

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'INACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    const [appointmentCountArgs] = prisma.appointment.count.mock.calls as [
      [
        {
          where: {
            status: string;
            startTime: { gt: Date };
            services: {
              some: {
                salonService: {
                  salonId: string;
                };
              };
            };
          };
        },
      ],
    ];
    const [appointmentCountCall] = appointmentCountArgs;
    expect(appointmentCountCall.where.status).toBe('CONFIRMED');
    expect(appointmentCountCall.where.startTime.gt).toBeInstanceOf(Date);
    expect(appointmentCountCall.where.services.some.salonService.salonId).toBe('branch-1');
    expect(prisma.salonBranch.update).not.toHaveBeenCalled();
  });

  it('updates branch hours timezone alongside a branch timezone change and maps duplicate branch updates to conflict', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ timezone: 'Asia/Tokyo' }));
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salon.findUnique.mockResolvedValueOnce({ id: 'branch-1', ownerId: 'user-1', metadata: { label: 'existing' } });
    prisma.salonBranch.update.mockResolvedValue(branch({ timezone: 'Asia/Seoul' }));

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Seoul',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).resolves.toMatchObject({ timezone: 'Asia/Seoul' });

    expect(prisma.salonBranchHours.updateMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-1' },
      data: { timezone: 'Asia/Seoul' },
    });
    const [salonUpsertArgs] = prisma.salon.upsert.mock.calls[0] as [SalonUpsertArgs];
    expect(salonUpsertArgs.update).toMatchObject({
      tenant: { connect: { id: 'tenant-1' } },
      owner: { connect: { id: 'user-1' } },
      name: 'Main Branch',
      phone: '1234567890',
      email: 'branch@example.com',
      isActive: true,
    });
    expect(salonUpsertArgs.update.metadata).toMatchObject({
      label: 'existing',
      timezone: 'Asia/Seoul',
    });

    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.update.mockRejectedValueOnce(prismaKnownError('P2002'));

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('builds operational salon slugs from the full branch id', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.create.mockResolvedValue(branch({ id: '11111111-1111-4111-8111-111111111111', name: 'Main Branch' }));

    await service.createBranch(
      { user: user() },
      {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      },
    );

    const [salonUpsertArgs] = prisma.salon.upsert.mock.calls[0] as [SalonUpsertArgs];
    expect(salonUpsertArgs.create.slug).toBe('main-branch-11111111-1111-4111-8111-111111111111');
  });

  it('surfaces an in-transaction branch lookup miss during update', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBusiness.findFirst.mockResolvedValueOnce(business()).mockResolvedValueOnce(null);

    await expect(
      service.updateBranch({ user: user() }, 'branch-1', {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replaces weekly hours atomically', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue({
      ...branch(),
      business: { tenantId: 'tenant-1' },
    });
    prisma.salonBranchHours.deleteMany.mockReturnValue('delete-op');
    prisma.salonBranchHours.createMany.mockReturnValue('create-op');

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
    expect(prisma.salonBranchHours.deleteMany).toHaveBeenCalledWith({ where: { branchId: 'branch-1' } });
    expect(prisma.salonBranchHours.createMany).toHaveBeenCalled();
    expectAuditCall(prisma.auditEvent.create.mock.calls as [AuditCreateArgs][], {
      action: 'salon_owner.branch.hours.replace',
      targetId: 'branch-1',
    });
  });

  it('rejects hours replacement when the branch timezone changed before the transaction writes', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue({
      ...branch({ timezone: 'Asia/Seoul' }),
      business: { tenantId: 'tenant-1' },
    });

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: dayOfWeek !== 0,
          intervals: dayOfWeek === 0 ? [] : [{ start: '09:00', end: '17:00' }],
        })),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.salonBranchHours.deleteMany).not.toHaveBeenCalled();
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

    await expect(
      service.setBranchHoliday({ user: user() }, 'branch-1', 'not-a-date', {
        closed: true,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects closed-day weekly hours that still carry intervals', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue({
      ...branch(),
      business: { tenantId: 'tenant-1' },
    });

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: false,
          intervals: dayOfWeek === 1 ? [{ start: '09:00', end: '10:00' }] : [],
        })),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects duplicate, incomplete, and overlapping weekly hours payloads', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue({
      ...branch(),
      business: { tenantId: 'tenant-1' },
    });

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [
          { dayOfWeek: 0, open: false, intervals: [] },
          { dayOfWeek: 1, open: false, intervals: [] },
          { dayOfWeek: 2, open: false, intervals: [] },
          { dayOfWeek: 3, open: false, intervals: [] },
          { dayOfWeek: 4, open: false, intervals: [] },
          { dayOfWeek: 5, open: false, intervals: [] },
        ],
      } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 0, 2, 3, 4, 5, 6].map((dayOfWeek, index) => ({
          dayOfWeek,
          open: index === 1,
          intervals: index === 1 ? [{ start: '09:00', end: '10:00' }] : [],
        })),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: dayOfWeek === 1,
          intervals: dayOfWeek === 1 ? [{ start: '09:00', end: '09:00' }] : [],
        })),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: dayOfWeek === 1,
          intervals:
            dayOfWeek === 1
              ? [
                  { start: '09:00', end: '11:00' },
                  { start: '10:30', end: '12:00' },
                ]
              : [],
        })),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: dayOfWeek === 1,
          intervals: dayOfWeek === 1 ? [{ start: '24:00', end: '25:00' }] : [],
        })),
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('upserts holidays and branch policy', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
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
    expectAuditCall(prisma.auditEvent.create.mock.calls as [AuditCreateArgs][], {
      action: 'salon_owner.branch.holiday.set',
      targetId: 'branch-1',
    });

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
    expectAuditCall(prisma.auditEvent.create.mock.calls as [AuditCreateArgs][], {
      action: 'salon_owner.branch.policy.update',
      targetId: 'branch-1',
    });
  });

  it('rejects holiday replacements that mix closed state and intervals or omit open intervals', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());

    await expect(
      service.setBranchHoliday({ user: user() }, 'branch-1', '2026-05-26', {
        closed: true,
        intervals: [{ start: '09:00', end: '10:00' }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.setBranchHoliday({ user: user() }, 'branch-1', '2026-05-26', {
        closed: false,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('surfaces an in-transaction branch miss during hours replacement', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(null);

    await expect(
      service.replaceBranchHours({ user: user() }, 'branch-1', {
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: false,
          intervals: [],
        })),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears an existing holiday reason when the replacement omits it', async () => {
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranchHoliday.upsert.mockResolvedValue({
      id: 'holiday-1',
      branchId: 'branch-1',
      date: new Date('2026-05-26T00:00:00.000Z'),
      closed: true,
      reason: null,
      intervals: [],
      createdAt: now,
      updatedAt: now,
    });

    await service.setBranchHoliday({ user: user() }, 'branch-1', '2026-05-26', {
      closed: true,
    });

    const [upsertArgs] = prisma.salonBranchHoliday.upsert.mock.calls[0] as [HolidayUpsertArgs];
    expect(upsertArgs.update.reason).toBeNull();
  });

  it('handles malformed stored values through the internal mappers', () => {
    expect(() =>
      (
        service as unknown as {
          mapBranch(input: Record<string, unknown>): unknown;
        }
      ).mapBranch({
        ...branch(),
        address: null,
      }),
    ).toThrow('Stored branch address is not an object');

    expect(() =>
      (
        service as unknown as {
          mapHoliday(input: Record<string, unknown>): unknown;
        }
      ).mapHoliday({
        branchId: 'branch-1',
        date: new Date('2026-05-26T00:00:00.000Z'),
        closed: true,
        reason: null,
        intervals: {},
      }),
    ).toThrow('Stored intervals are not an array');

    expect(() =>
      (
        service as unknown as {
          readIntervals(input: unknown): unknown;
        }
      ).readIntervals([null]),
    ).toThrow('Stored interval is not an object');
  });

  it('covers idempotency record parsing edge cases', () => {
    const privateService = service as unknown as {
      parseIdempotencyRecord(value: string | null): { requestHash: string; resourceId: string } | null;
    };

    expect(privateService.parseIdempotencyRecord(null)).toBeNull();
    expect(privateService.parseIdempotencyRecord('missing-separator')).toBeNull();
    expect(privateService.parseIdempotencyRecord('hash:resource')).toEqual({
      requestHash: 'hash',
      resourceId: 'resource',
    });
  });

  it('returns null from idempotency replay helpers when audit metadata is absent or malformed', async () => {
    prisma.auditEvent.findFirst.mockResolvedValueOnce({ reason: null }).mockResolvedValueOnce({ reason: 'bad-reason' });

    await expect(
      (
        service as unknown as {
          findIdempotentBusinessReplay(
            prismaArg: { auditEvent: { findFirst: jest.Mock }; salonBusiness: { findFirst: jest.Mock } },
            context: { user: AuthenticatedUser; idempotencyKey?: string },
            tenantId: string,
            requestHash: string,
          ): Promise<unknown>;
        }
      ).findIdempotentBusinessReplay(prisma as never, { user: user(), idempotencyKey: 'idem-1' }, 'tenant-1', 'hash'),
    ).resolves.toBeNull();

    await expect(
      (
        service as unknown as {
          findIdempotentBranchReplay(
            prismaArg: { auditEvent: { findFirst: jest.Mock }; salonBranch: { findFirst: jest.Mock } },
            context: { user: AuthenticatedUser; idempotencyKey?: string },
            tenantId: string,
            requestHash: string,
          ): Promise<unknown>;
        }
      ).findIdempotentBranchReplay(prisma as never, { user: user(), idempotencyKey: 'idem-1' }, 'tenant-1', 'hash'),
    ).resolves.toBeNull();
  });

  it('rejects branch replay when the same idempotency key is reused with a different payload', async () => {
    const input = {
      businessId: 'business-1',
      name: 'Downtown',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE' as const,
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    };
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.auditEvent.findFirst.mockResolvedValue({
      reason: 'different-hash:branch-1',
    });

    await expect(service.createBranch({ user: user(), idempotencyKey: 'idem-1' }, input)).rejects.toBeInstanceOf(ConflictException);
  });

  it('treats equivalent idempotency payloads with different object key order as the same request', async () => {
    const originalInput = {
      businessId: 'business-1',
      name: 'Downtown',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE' as const,
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    };
    const reorderedInput = {
      address: {
        country: 'JP',
        postalCode: '1000001',
        state: 'Tokyo',
        city: 'Tokyo',
        line1: '1 Main St',
      },
      status: 'ACTIVE' as const,
      currency: 'JPY',
      timezone: 'Asia/Tokyo',
      name: 'Downtown',
      businessId: 'business-1',
    };
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.auditEvent.findFirst.mockResolvedValue({
      reason: `${hashIdempotencyPayload(originalInput)}:branch-1`,
    });
    prisma.salonBranch.findFirst.mockResolvedValue(branch({ name: 'Downtown' }));

    await expect(service.createBranch({ user: user(), idempotencyKey: 'idem-1' }, reorderedInput)).resolves.toMatchObject({
      id: 'branch-1',
    });
  });

  it('maps stored holiday intervals back into API models', () => {
    const result = (
      service as unknown as {
        mapHoliday(input: Record<string, unknown>): { intervals: Array<{ start: string; end: string }> };
      }
    ).mapHoliday({
      branchId: 'branch-1',
      date: new Date('2026-05-26T00:00:00.000Z'),
      closed: false,
      reason: null,
      intervals: [{ start: '09:00', end: '10:00' }],
    });

    expect(result.intervals).toEqual([{ start: '09:00', end: '10:00' }]);
  });
});
