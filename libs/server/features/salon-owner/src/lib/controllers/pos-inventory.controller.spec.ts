import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { InventoryController } from './inventory.controller';
import { PosController } from './pos.controller';
import type { PosInventoryService } from '../services/pos-inventory.service';

const user: AuthenticatedUser = { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1' };

function serviceMock() {
  return {
    getCheckoutContext: jest.fn(),
    createInvoice: jest.fn(),
    getInvoice: jest.fn(),
    finalizeInvoice: jest.fn(),
    captureInvoicePayment: jest.fn(),
    listPendingDues: jest.fn(),
    listProducts: jest.fn(),
    createProduct: jest.fn(),
    getProduct: jest.fn(),
    updateProduct: jest.fn(),
    listBranchStock: jest.fn(),
    createStockMovement: jest.fn(),
    adjustProductStock: jest.fn(),
    listLowStockAlerts: jest.fn(),
  };
}

describe('PosController', () => {
  it('delegates POS routes to the service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new PosController(service as unknown as PosInventoryService);
    const invoice = {
      branchId: 'branch-1',
      customerId: 'customer-1',
      lines: [{ type: 'SERVICE' as const, referenceId: 'service-1', description: 'Cut', quantity: '1', unitPrice: '45.00' }],
    };
    const payment = { amount: '45.00', method: 'CASH', receivedAt: '2026-05-26T09:00:00.000Z' };

    await controller.getCheckoutContext(user, 'appointment-1', 'customer-1');
    await controller.createInvoice(user, invoice);
    await controller.getInvoice(user, 'invoice-1');
    await controller.finalizeInvoice(user, 'invoice-1', { confirmedTotal: '45.00' });
    await controller.captureInvoicePayment(user, 'invoice-1', payment);
    await controller.listPendingDues(user, 'branch-1');

    expect(service.getCheckoutContext).toHaveBeenCalledWith({ user }, 'appointment-1', 'customer-1');
    expect(service.createInvoice).toHaveBeenCalledWith({ user }, invoice);
    expect(service.getInvoice).toHaveBeenCalledWith({ user }, 'invoice-1');
    expect(service.finalizeInvoice).toHaveBeenCalledWith({ user }, 'invoice-1', { confirmedTotal: '45.00' });
    expect(service.captureInvoicePayment).toHaveBeenCalledWith({ user }, 'invoice-1', payment);
    expect(service.listPendingDues).toHaveBeenCalledWith({ user }, 'branch-1');
  });
});

describe('InventoryController', () => {
  it('delegates inventory routes to the service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new InventoryController(service as unknown as PosInventoryService);
    const product = { name: 'Shampoo', sku: 'SKU-1', unit: 'PIECE' as const, retailPrice: '12.00', status: 'ACTIVE' as const };
    const movement = { branchId: 'branch-1', productId: 'product-1', quantity: '3', reason: 'PURCHASE' };

    await controller.listProducts(user, 'sha');
    await controller.createProduct(user, product);
    await controller.getProduct(user, 'product-1');
    await controller.updateProduct(user, 'product-1', product);
    await controller.listBranchStock(user, 'branch-1');
    await controller.createStockMovement(user, movement);
    await controller.adjustProductStock(user, 'product-1', movement);
    await controller.listLowStockAlerts(user, 'branch-1');

    expect(service.listProducts).toHaveBeenCalledWith({ user }, 'sha');
    expect(service.createProduct).toHaveBeenCalledWith({ user }, product);
    expect(service.getProduct).toHaveBeenCalledWith({ user }, 'product-1');
    expect(service.updateProduct).toHaveBeenCalledWith({ user }, 'product-1', product);
    expect(service.listBranchStock).toHaveBeenCalledWith({ user }, 'branch-1');
    expect(service.createStockMovement).toHaveBeenCalledWith({ user }, movement);
    expect(service.adjustProductStock).toHaveBeenCalledWith({ user }, 'product-1', movement);
    expect(service.listLowStockAlerts).toHaveBeenCalledWith({ user }, 'branch-1');
  });
});
