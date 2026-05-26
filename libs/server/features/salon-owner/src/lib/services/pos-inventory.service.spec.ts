import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { PosInventoryService } from './pos-inventory.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1', ...overrides };
}

function branch() {
  return { id: 'branch-1', businessId: 'business-1', name: 'Main', timezone: 'Asia/Tokyo', currency: 'JPY', address: {}, createdAt: now, updatedAt: now };
}

function business() {
  return { id: 'business-1', tenantId: 'tenant-1', displayName: 'Salon', status: 'ACTIVE', createdAt: now, updatedAt: now };
}

function invoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invoice-1',
    branchId: 'branch-1',
    customerId: 'customer-1',
    appointmentId: null,
    status: 'DRAFT',
    subtotal: new Prisma.Decimal('45.00'),
    taxTotal: new Prisma.Decimal('0.00'),
    discountTotal: new Prisma.Decimal('0.00'),
    total: new Prisma.Decimal('45.00'),
    paidAmount: new Prisma.Decimal('0.00'),
    dueAmount: new Prisma.Decimal('45.00'),
    lines: [
      {
        id: 'line-1',
        invoiceId: 'invoice-1',
        type: 'SERVICE',
        referenceId: 'service-1',
        description: 'Cut',
        quantity: new Prisma.Decimal('1'),
        unitPrice: new Prisma.Decimal('45.00'),
        lineTotal: new Prisma.Decimal('45.00'),
      },
    ],
    payments: [],
    createdAt: now,
    updatedAt: now,
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function movement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'movement-1',
    branchId: 'branch-1',
    productId: 'product-1',
    quantity: new Prisma.Decimal('3'),
    reason: 'PURCHASE',
    note: null,
    createdAt: now,
    ...overrides,
  };
}

function createPrismaMock() {
  const prisma = {
    salonBusiness: { findFirst: jest.fn() },
    salonBranch: { findFirst: jest.fn() },
    salonOwnerCustomer: { findFirst: jest.fn() },
    salonOwnerAppointment: { findFirst: jest.fn() },
    salonOwnerInvoice: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    salonOwnerInvoicePayment: { create: jest.fn() },
    salonOwnerProduct: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    salonOwnerStockMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma)),
  };
  return prisma;
}

describe('PosInventoryService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: PosInventoryService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PosInventoryService(prisma as unknown as PrismaService);
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonOwnerCustomer.findFirst.mockResolvedValue({ id: 'customer-1', businessId: 'business-1' });
    prisma.salonOwnerAppointment.findFirst.mockResolvedValue({ id: 'appointment-1', branchId: 'branch-1' });
    prisma.salonOwnerProduct.findFirst.mockResolvedValue(product());
    prisma.salonOwnerStockMovement.findMany.mockResolvedValue([]);
  });

  it('requires tenant scope', async () => {
    await expect(service.getCheckoutContext({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates invoices with computed totals', async () => {
    prisma.salonOwnerInvoice.create.mockResolvedValue(invoice());

    const result = await service.createInvoice(
      { user: user() },
      {
        branchId: 'branch-1',
        customerId: 'customer-1',
        lines: [{ type: 'SERVICE', referenceId: 'service-1', description: ' Cut ', quantity: '1', unitPrice: '45.00' }],
      },
    );

    expect(result).toMatchObject({ id: 'invoice-1', total: '45.00', dueAmount: '45.00' });
    expect(prisma.salonOwnerInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: new Prisma.Decimal('45.00'),
          total: new Prisma.Decimal('45.00'),
          dueAmount: new Prisma.Decimal('45.00'),
        }),
      }),
    );
  });

  it('rejects finalize total mismatches', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice());

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '40.00' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('finalizes product invoices with sale stock movements', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(
      invoice({
        lines: [
          {
            id: 'line-1',
            invoiceId: 'invoice-1',
            type: 'PRODUCT',
            referenceId: 'product-1',
            description: 'Shampoo',
            quantity: new Prisma.Decimal('2'),
            unitPrice: new Prisma.Decimal('12.00'),
            lineTotal: new Prisma.Decimal('24.00'),
          },
        ],
        subtotal: new Prisma.Decimal('24.00'),
        total: new Prisma.Decimal('24.00'),
        dueAmount: new Prisma.Decimal('24.00'),
      }),
    );
    prisma.salonOwnerStockMovement.findMany.mockResolvedValue([movement({ quantity: new Prisma.Decimal('3') })]);
    prisma.salonOwnerInvoice.update.mockResolvedValue(invoice({ status: 'FINALIZED' }));

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '24.00' })).resolves.toMatchObject({
      status: 'FINALIZED',
    });
    expect(prisma.salonOwnerStockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ productId: 'product-1', quantity: new Prisma.Decimal('-2'), reason: 'SALE' }) }),
    );
  });

  it('captures payments and marks paid invoices', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice({ status: 'FINALIZED' }));
    prisma.salonOwnerInvoice.update.mockResolvedValue(
      invoice({ status: 'PAID', paidAmount: new Prisma.Decimal('45.00'), dueAmount: new Prisma.Decimal('0.00') }),
    );

    const result = await service.captureInvoicePayment(
      { user: user() },
      'invoice-1',
      { amount: '45.00', method: 'CASH', receivedAt: '2026-05-26T09:00:00.000Z' },
    );

    expect(result).toMatchObject({ status: 'PAID', paidAmount: '45.00', dueAmount: '0.00' });
    expect(prisma.salonOwnerInvoicePayment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ invoiceId: 'invoice-1' }) }));
  });

  it('lists branch stock and low-stock alerts from stock movements', async () => {
    prisma.salonOwnerProduct.findMany.mockResolvedValue([
      { ...product(), stockMovements: [movement({ quantity: new Prisma.Decimal('1') })] },
      { ...product({ id: 'product-2', sku: 'SKU-2', reorderPoint: new Prisma.Decimal('1') }), stockMovements: [movement()] },
    ]);

    const stock = await service.listBranchStock({ user: user() }, 'branch-1');
    const alerts = await service.listLowStockAlerts({ user: user() }, 'branch-1');

    expect(stock.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'product-1', currentQuantity: '1', reorderPoint: '2', lowStock: true }),
        expect.objectContaining({ productId: 'product-2', currentQuantity: '3', reorderPoint: '1', lowStock: false }),
      ]),
    );
    expect(alerts.items).toEqual([expect.objectContaining({ productId: 'product-1', lowStock: true })]);
  });

  it('creates stock movements and blocks negative balances', async () => {
    prisma.salonOwnerStockMovement.create.mockResolvedValue(movement());

    await expect(
      service.createStockMovement(
        { user: user() },
        { branchId: 'branch-1', productId: 'product-1', quantity: '3', reason: 'PURCHASE' },
      ),
    ).resolves.toMatchObject({ id: 'movement-1', quantity: '3' });

    prisma.salonOwnerStockMovement.findMany.mockResolvedValue([movement({ quantity: new Prisma.Decimal('1') })]);
    await expect(
      service.createStockMovement(
        { user: user() },
        { branchId: 'branch-1', productId: 'product-1', quantity: '-2', reason: 'SALE' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found for out-of-scope products', async () => {
    prisma.salonOwnerProduct.findFirst.mockResolvedValue(null);

    await expect(service.getProduct({ user: user() }, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
