import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PosInventoryApi } from './pos-inventory.api';

describe('PosInventoryApi', () => {
  let api: PosInventoryApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(PosInventoryApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('sends POS commands to documented endpoints', () => {
    api.getCheckoutContext('appointment-1', 'customer-1').subscribe();
    expect(http.expectOne('/api/partner/pos/checkout-context?appointmentId=appointment-1&customerId=customer-1').request.method).toBe('GET');

    api
      .createInvoice({
        branchId: 'branch-1',
        customerId: 'customer-1',
        lines: [{ type: 'SERVICE', referenceId: 'service-1', description: 'Cut', quantity: '1', unitPrice: '45.00' }],
      })
      .subscribe();
    expect(http.expectOne('/api/partner/pos/invoices').request.method).toBe('POST');

    api.finalizeInvoice('invoice-1', { confirmedTotal: '45.00' }).subscribe();
    const finalize = http.expectOne('/api/partner/pos/invoices/invoice-1/finalize');
    expect(finalize.request.method).toBe('POST');
    expect(finalize.request.headers.has('Idempotency-Key')).toBe(true);

    api.captureInvoicePayment('invoice-1', { amount: '45.00', method: 'CASH', receivedAt: '2026-05-26T09:00:00.000Z' }).subscribe();
    const payment = http.expectOne('/api/partner/pos/invoices/invoice-1/payments');
    expect(payment.request.method).toBe('POST');
    expect(payment.request.headers.has('Idempotency-Key')).toBe(true);

    http.match(() => true).forEach((request) => request.flush({ success: true, data: { id: 'ok' } }));
  });

  it('sends inventory commands to documented endpoints', () => {
    api.listProducts('sha').subscribe();
    expect(http.expectOne('/api/partner/inventory/products?q=sha').request.method).toBe('GET');

    api.createProduct({ name: 'Shampoo', sku: 'SKU-1', unit: 'PIECE', retailPrice: '12.00', status: 'ACTIVE' }).subscribe();
    expect(http.expectOne('/api/partner/inventory/products').request.method).toBe('POST');

    api.updateProduct('product-1', { name: 'Shampoo', sku: 'SKU-1', unit: 'PIECE', retailPrice: '12.00', status: 'ACTIVE' }).subscribe();
    expect(http.expectOne('/api/partner/inventory/products/product-1').request.method).toBe('PATCH');

    api.listBranchStock('branch-1').subscribe();
    expect(http.expectOne('/api/partner/inventory/branch-stock?branchId=branch-1').request.method).toBe('GET');

    api.createStockMovement({ branchId: 'branch-1', productId: 'product-1', quantity: '3', reason: 'PURCHASE' }).subscribe();
    const movement = http.expectOne('/api/partner/inventory/stock-movements');
    expect(movement.request.method).toBe('POST');
    expect(movement.request.headers.has('Idempotency-Key')).toBe(true);

    api.listLowStockAlerts('branch-1').subscribe();
    expect(http.expectOne('/api/partner/inventory/low-stock-alerts?branchId=branch-1').request.method).toBe('GET');

    http.match(() => true).forEach((request) => request.flush({ success: true, data: { items: [], page: { limit: 0, nextCursor: null, hasMore: false } } }));
  });
});
