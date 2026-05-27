import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { DashboardQueryService } from './dashboard-query.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1', ...overrides };
}

function branch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    address: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
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

function payment(overrides: Record<string, unknown> = {}) {
  return {
    amount: new Prisma.Decimal('30.00'),
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
    salonBranch: { findFirst: jest.fn(), findMany: jest.fn() },
    salonOwnerAppointment: { findMany: jest.fn() },
    salonOwnerInvoice: { findMany: jest.fn() },
    salonOwnerInvoicePayment: { findMany: jest.fn() },
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
    prisma.salonBranch.findMany.mockResolvedValue([branch()]);
    prisma.salonOwnerAppointment.findMany.mockResolvedValue([
      { status: 'BOOKED', estimatedWaitMinutes: null },
      { status: 'ARRIVED', estimatedWaitMinutes: 10 },
    ]);
    prisma.salonOwnerInvoice.findMany.mockResolvedValue([invoice()]);
    prisma.salonOwnerInvoicePayment.findMany.mockResolvedValue([payment()]);
    prisma.salonOwnerProduct.findMany.mockResolvedValue([product()]);
  });

  it('requires tenant scope', async () => {
    await expect(service.getOwnerDashboard({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid dashboard dates', async () => {
    await expect(service.getOwnerDashboard({ user: user() }, 'branch-1', 'bad-date')).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects overflow dashboard dates', async () => {
    await expect(service.getOwnerDashboard({ user: user() }, 'branch-1', '2026-02-31')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('aggregates appointment, revenue, and inventory alert metrics', async () => {
    const result = await service.getOwnerDashboard({ user: user() }, 'branch-1', '2026-05-26');

    expect(result.businessDate).toBe('2026-05-26');
    expect(result.branchId).toBe('branch-1');
    expect(result.appointments).toEqual(expect.objectContaining({ BOOKED: 1, ARRIVED: 1, WALK_IN: 1 }));
    expect(result.revenue).toEqual({ gross: '45.00', paid: '30.00', due: '15.00' });
    expect(result.inventoryAlerts).toBe(1);
    expect(prisma.salonOwnerAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              branchId: 'branch-1',
              lines: { some: { startsAt: { gte: new Date('2026-05-25T15:00:00.000Z'), lt: new Date('2026-05-26T15:00:00.000Z') } } },
            },
          ],
        },
      }),
    );
    expect(prisma.salonOwnerInvoice.findMany).toHaveBeenCalledWith({
      where: {
        status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] },
        OR: [{ branchId: 'branch-1', createdAt: { gte: new Date('2026-05-25T15:00:00.000Z'), lt: new Date('2026-05-26T15:00:00.000Z') } }],
      },
      select: { id: true, branchId: true, customerId: true, status: true, total: true, paidAmount: true, dueAmount: true },
    });
    expect(prisma.salonOwnerInvoicePayment.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            receivedAt: { gte: new Date('2026-05-25T15:00:00.000Z'), lt: new Date('2026-05-26T15:00:00.000Z') },
            invoice: { branchId: 'branch-1', status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] } },
          },
        ],
      },
      select: { amount: true },
    });
  });

  it('uses payment received dates for paid revenue', async () => {
    prisma.salonOwnerInvoice.findMany.mockResolvedValue([invoice({ paidAmount: new Prisma.Decimal('999.00') })]);
    prisma.salonOwnerInvoicePayment.findMany.mockResolvedValue([payment({ amount: new Prisma.Decimal('18.00') })]);

    const result = await service.getOwnerDashboard({ user: user() }, 'branch-1', '2026-05-26');

    expect(result.revenue).toEqual({ gross: '45.00', paid: '18.00', due: '15.00' });
  });

  it('aggregates all tenant branches when branchId is omitted', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch(), branch({ id: 'branch-2', businessId: 'business-2', timezone: 'UTC' })]);
    prisma.salonOwnerProduct.findMany
      .mockResolvedValueOnce([product()])
      .mockResolvedValueOnce([product({ id: 'product-2', businessId: 'business-2' })]);

    const result = await service.getOwnerDashboard({ user: user() }, undefined, '2026-05-26');

    expect(result.branchId).toBeNull();
    expect(result.inventoryAlerts).toBe(2);
    expect(prisma.salonBranch.findMany).toHaveBeenCalledWith({
      where: { business: { tenantId: 'tenant-1' } },
      orderBy: { createdAt: 'asc' },
    });
    expect(prisma.salonOwnerInvoice.findMany).toHaveBeenCalledWith({
      where: {
        status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] },
        OR: [
          { branchId: 'branch-1', createdAt: { gte: new Date('2026-05-25T15:00:00.000Z'), lt: new Date('2026-05-26T15:00:00.000Z') } },
          { branchId: 'branch-2', createdAt: { gte: new Date('2026-05-26T00:00:00.000Z'), lt: new Date('2026-05-27T00:00:00.000Z') } },
        ],
      },
      select: { id: true, branchId: true, customerId: true, status: true, total: true, paidAmount: true, dueAmount: true },
    });
    expect(prisma.salonOwnerInvoicePayment.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            receivedAt: { gte: new Date('2026-05-25T15:00:00.000Z'), lt: new Date('2026-05-26T15:00:00.000Z') },
            invoice: { branchId: 'branch-1', status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] } },
          },
          {
            receivedAt: { gte: new Date('2026-05-26T00:00:00.000Z'), lt: new Date('2026-05-27T00:00:00.000Z') },
            invoice: { branchId: 'branch-2', status: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] } },
          },
        ],
      },
      select: { amount: true },
    });
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

  it('aggregates alerts across all tenant branches when branchId is omitted', async () => {
    prisma.salonBranch.findMany.mockResolvedValue([branch(), branch({ id: 'branch-2', businessId: 'business-2' })]);
    prisma.salonOwnerProduct.findMany
      .mockResolvedValueOnce([product()])
      .mockResolvedValueOnce([product({ id: 'product-2', businessId: 'business-2' })]);

    const result = await service.listDashboardAlerts({ user: user() });

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'low-stock:branch-1:product-1', branchId: 'branch-1' }),
        expect.objectContaining({ id: 'low-stock:branch-2:product-2', branchId: 'branch-2' }),
      ]),
    );
    expect(prisma.salonOwnerInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { branchId: { in: ['branch-1', 'branch-2'] }, dueAmount: { gt: 0 } } }),
    );
  });
});
