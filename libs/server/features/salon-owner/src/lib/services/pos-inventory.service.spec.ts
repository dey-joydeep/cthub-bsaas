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
  return {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    address: {},
    createdAt: now,
    updatedAt: now,
  };
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
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
    prisma.salonOwnerProduct.findMany.mockResolvedValue([product()]);
    prisma.salonOwnerStockMovement.findMany.mockResolvedValue([]);
    prisma.salonOwnerInvoice.findFirstOrThrow.mockResolvedValue(invoice({ status: 'FINALIZED' }));
    prisma.salonOwnerInvoice.updateMany.mockResolvedValue({ count: 1 });
  });

  it('requires tenant scope', async () => {
    await expect(service.getCheckoutContext({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns checkout context defaults', async () => {
    await expect(service.getCheckoutContext({ user: user() }, 'appointment-1', 'customer-1')).resolves.toEqual({
      businessId: 'business-1',
      appointmentId: 'appointment-1',
      customerId: 'customer-1',
    });
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

  it('creates invoices with appointment scope when provided', async () => {
    prisma.salonOwnerInvoice.create.mockResolvedValue(invoice({ appointmentId: 'appointment-1' }));

    await expect(
      service.createInvoice(
        { user: user() },
        {
          branchId: 'branch-1',
          customerId: 'customer-1',
          appointmentId: 'appointment-1',
          lines: [{ type: 'SERVICE', referenceId: 'service-1', description: 'Cut', quantity: '1', unitPrice: '45.00' }],
        },
      ),
    ).resolves.toMatchObject({ appointmentId: 'appointment-1' });

    expect(prisma.salonOwnerAppointment.findFirst).toHaveBeenCalledWith({ where: { id: 'appointment-1', branchId: 'branch-1' } });
  });

  it('gets invoices in tenant scope', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice({ status: 'FINALIZED' }));

    await expect(service.getInvoice({ user: user() }, 'invoice-1')).resolves.toMatchObject({ id: 'invoice-1', status: 'FINALIZED' });
  });

  it('rejects finalize total mismatches', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice());

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '40.00' })).rejects.toBeInstanceOf(
      ConflictException,
    );
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
    prisma.salonOwnerInvoice.findFirstOrThrow.mockResolvedValue(invoice({ status: 'FINALIZED' }));

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '24.00' })).resolves.toMatchObject({
      status: 'FINALIZED',
    });
    expect(prisma.salonOwnerStockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productId: 'product-1', quantity: new Prisma.Decimal('-2'), reason: 'SALE' }),
      }),
    );
    expect(prisma.salonOwnerInvoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'invoice-1', status: 'DRAFT' },
      data: { status: 'FINALIZED' },
    });
  });

  it('rejects concurrent invoice finalization after the conditional write loses', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice());
    prisma.salonOwnerInvoice.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '45.00' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.salonOwnerStockMovement.create).not.toHaveBeenCalled();
  });

  it('validates product lines against branch business before finalizing', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(
      invoice({
        lines: [
          {
            id: 'line-1',
            invoiceId: 'invoice-1',
            type: 'PRODUCT',
            referenceId: 'product-1',
            description: 'Shampoo',
            quantity: new Prisma.Decimal('1'),
            unitPrice: new Prisma.Decimal('12.00'),
            lineTotal: new Prisma.Decimal('12.00'),
          },
        ],
        subtotal: new Prisma.Decimal('12.00'),
        total: new Prisma.Decimal('12.00'),
        dueAmount: new Prisma.Decimal('12.00'),
      }),
    );
    prisma.salonOwnerProduct.findMany.mockResolvedValue([]);

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '12.00' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.salonOwnerStockMovement.create).not.toHaveBeenCalled();
  });

  it('aggregates duplicate product lines before checking stock', async () => {
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
          {
            id: 'line-2',
            invoiceId: 'invoice-1',
            type: 'PRODUCT',
            referenceId: 'product-1',
            description: 'Shampoo',
            quantity: new Prisma.Decimal('2'),
            unitPrice: new Prisma.Decimal('12.00'),
            lineTotal: new Prisma.Decimal('24.00'),
          },
        ],
        subtotal: new Prisma.Decimal('48.00'),
        total: new Prisma.Decimal('48.00'),
        dueAmount: new Prisma.Decimal('48.00'),
      }),
    );
    prisma.salonOwnerStockMovement.findMany.mockResolvedValue([movement({ quantity: new Prisma.Decimal('3') })]);

    await expect(service.finalizeInvoice({ user: user() }, 'invoice-1', { confirmedTotal: '48.00' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.salonOwnerStockMovement.create).not.toHaveBeenCalled();
  });

  it('captures payments and marks paid invoices', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice({ status: 'FINALIZED' }));
    prisma.salonOwnerInvoice.findFirstOrThrow.mockResolvedValue(
      invoice({ status: 'PARTIALLY_PAID', paidAmount: new Prisma.Decimal('45.00'), dueAmount: new Prisma.Decimal('0.00') }),
    );
    prisma.salonOwnerInvoice.update.mockResolvedValue(
      invoice({ status: 'PAID', paidAmount: new Prisma.Decimal('45.00'), dueAmount: new Prisma.Decimal('0.00') }),
    );

    const result = await service.captureInvoicePayment({ user: user() }, 'invoice-1', {
      amount: '45.00',
      method: 'CASH',
      receivedAt: '2026-05-26T09:00:00.000Z',
    });

    expect(result).toMatchObject({ status: 'PAID', paidAmount: '45.00', dueAmount: '0.00' });
    expect(prisma.salonOwnerInvoicePayment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ invoiceId: 'invoice-1' }) }),
    );
    expect(prisma.salonOwnerInvoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'invoice-1', status: { in: ['FINALIZED', 'PARTIALLY_PAID'] }, dueAmount: { gte: new Prisma.Decimal('45.00') } },
      data: {
        paidAmount: { increment: new Prisma.Decimal('45.00') },
        dueAmount: { decrement: new Prisma.Decimal('45.00') },
        status: 'PARTIALLY_PAID',
      },
    });
  });

  it('keeps partial payments partially paid when due remains', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice({ status: 'FINALIZED' }));
    prisma.salonOwnerInvoice.findFirstOrThrow.mockResolvedValue(
      invoice({ status: 'PARTIALLY_PAID', paidAmount: new Prisma.Decimal('10.00'), dueAmount: new Prisma.Decimal('35.00') }),
    );

    await expect(
      service.captureInvoicePayment({ user: user() }, 'invoice-1', {
        amount: '10.00',
        method: 'CASH',
        receivedAt: '2026-05-26T09:00:00.000Z',
      }),
    ).resolves.toMatchObject({ status: 'PARTIALLY_PAID', dueAmount: '35.00' });

    expect(prisma.salonOwnerInvoice.update).not.toHaveBeenCalled();
  });

  it('rejects payments greater than the current due', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice({ status: 'FINALIZED', dueAmount: new Prisma.Decimal('10.00') }));

    await expect(
      service.captureInvoicePayment({ user: user() }, 'invoice-1', {
        amount: '11.00',
        method: 'CASH',
        receivedAt: '2026-05-26T09:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.salonOwnerInvoicePayment.create).not.toHaveBeenCalled();
  });

  it('rejects concurrent payment writes that no longer satisfy current due', async () => {
    prisma.salonOwnerInvoice.findFirst.mockResolvedValue(invoice({ status: 'FINALIZED' }));
    prisma.salonOwnerInvoice.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.captureInvoicePayment({ user: user() }, 'invoice-1', {
        amount: '45.00',
        method: 'CASH',
        receivedAt: '2026-05-26T09:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
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

  it('lists pending dues and searches products', async () => {
    prisma.salonOwnerInvoice.findMany.mockResolvedValue([invoice({ status: 'PARTIALLY_PAID' })]);
    prisma.salonOwnerProduct.findMany.mockResolvedValue([product()]);

    await expect(service.listPendingDues({ user: user() }, 'branch-1')).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'invoice-1' })],
    });
    await expect(service.listProducts({ user: user() }, 'sha')).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'product-1', name: 'Shampoo' })],
    });

    expect(prisma.salonOwnerProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ name: { contains: 'sha', mode: 'insensitive' } }, { sku: { contains: 'sha', mode: 'insensitive' } }],
        }),
      }),
    );
  });

  it('creates and updates products', async () => {
    prisma.salonOwnerProduct.create.mockResolvedValue(product());
    prisma.salonOwnerProduct.update.mockResolvedValue(product({ name: 'Conditioner', retailPrice: new Prisma.Decimal('15.00') }));

    await expect(
      service.createProduct(
        { user: user() },
        { name: ' Shampoo ', sku: ' SKU-1 ', unit: 'PIECE', retailPrice: '12.00', reorderPoint: '2', status: 'ACTIVE' },
      ),
    ).resolves.toMatchObject({ id: 'product-1', retailPrice: '12.00', reorderPoint: '2' });

    await expect(
      service.updateProduct({ user: user() }, 'product-1', {
        name: 'Conditioner',
        sku: 'SKU-2',
        unit: 'PIECE',
        retailPrice: '15.00',
        status: 'ACTIVE',
      }),
    ).resolves.toMatchObject({ name: 'Conditioner', retailPrice: '15.00' });
  });

  it('creates stock movements and blocks negative balances', async () => {
    prisma.salonOwnerStockMovement.create.mockResolvedValue(movement());

    await expect(
      service.createStockMovement({ user: user() }, { branchId: 'branch-1', productId: 'product-1', quantity: '3', reason: 'PURCHASE' }),
    ).resolves.toMatchObject({ id: 'movement-1', quantity: '3' });

    prisma.salonOwnerStockMovement.findMany.mockResolvedValue([movement({ quantity: new Prisma.Decimal('1') })]);
    await expect(
      service.createStockMovement({ user: user() }, { branchId: 'branch-1', productId: 'product-1', quantity: '-2', reason: 'SALE' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects mismatched stock adjustment product ids', async () => {
    await expect(
      service.adjustProductStock({ user: user() }, 'product-2', {
        branchId: 'branch-1',
        productId: 'product-1',
        quantity: '1',
        reason: 'ADJUSTMENT',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns not found for out-of-scope products', async () => {
    prisma.salonOwnerProduct.findFirst.mockResolvedValue(null);

    await expect(service.getProduct({ user: user() }, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
