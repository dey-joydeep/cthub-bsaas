import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { DashboardQueryService } from './dashboard-query.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1', ...overrides };
}

function branch() {
  return { id: 'branch-1', businessId: 'business-1', name: 'Main', timezone: 'Asia/Tokyo', currency: 'JPY', address: {}, createdAt: now, updatedAt: now };
}

function invoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invoice-1',
    branchId: 'branch-1',
    customerId: 'customer-1',
    status: 'PAID',
    total: new Prisma.Decimal('45.00'),
    paidAmount: new Prisma.Decimal('30.00'),
    dueAmount: new Prisma.Decimal('15.00'),
    ...overrides,
  };
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    businessId: 'business-1',
    name: 'Shampoo',
    sku: 'SKU-1',
    unit: 'PIECE',
    retailPrice: new Prisma.Decimal('12.00'),
    reorderPoint: new Prisma.Decimal('2'),
    status: 'ACTIVE',
    stockMovements: [{ quantity: new Prisma.Decimal('1') }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    salonBranch: { findFirst: jest.fn() },
    salonOwnerAppointment: { findMany: jest.fn() },
    salonOwnerInvoice: { findMany: jest.fn() },
    salonOwnerProduct: { findMany: jest.fn() },
  };
}

describe('DashboardQueryService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: DashboardQueryService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DashboardQueryService(prisma as unknown as PrismaService);
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerAppointment.findMany.mockResolvedValue([
      { status: 'BOOKED', estimatedWaitMinutes: null },
      { status: 'ARRIVED', estimatedWaitMinutes: 10 },
    ]);
    prisma.salonOwnerInvoice.findMany.mockResolvedValue([invoice()]);
    prisma.salonOwnerProduct.findMany.mockResolvedValue([product()]);
  });

  it('requires tenant scope', async () => {
    await expect(service.getOwnerDashboard({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid dashboard dates', async () => {
    await expect(service.getOwnerDashboard({ user: user() }, 'branch-1', 'bad-date')).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('aggregates appointment, revenue, and inventory alert metrics', async () => {
    const result = await service.getOwnerDashboard({ user: user() }, 'branch-1', '2026-05-26');

    expect(result).toEqual(
      expect.objectContaining({
        businessDate: '2026-05-26',
        branchId: 'branch-1',
        appointments: expect.objectContaining({ BOOKED: 1, ARRIVED: 1, WALK_IN: 1 }),
        revenue: { gross: '45.00', paid: '30.00', due: '15.00' },
        inventoryAlerts: 1,
      }),
    );
  });

  it('lists low-stock and pending-due alerts', async () => {
    const result = await service.listDashboardAlerts({ user: user() }, 'branch-1');

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'LOW_STOCK', entityId: 'product-1' }),
        expect.objectContaining({ kind: 'PENDING_DUE', entityId: 'invoice-1', amount: '15.00' }),
      ]),
    );
  });
});
