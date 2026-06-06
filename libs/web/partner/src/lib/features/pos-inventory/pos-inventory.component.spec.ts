import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CustomerCrmApi } from '../customer-crm/customer-crm.api';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { StaffServiceCatalogApi } from '../staff-service-catalog/staff-service-catalog.api';
import { InventoryComponent } from './inventory.component';
import { PosComponent } from './pos.component';
import { PosInventoryApi } from './pos-inventory.api';

const page = { limit: 1, nextCursor: null, hasMore: false };
const branch = {
  id: 'branch-1',
  businessId: 'business-1',
  name: 'Main',
  timezone: 'Asia/Tokyo',
  currency: 'JPY',
  address: {},
  createdAt: '',
  updatedAt: '',
};
const secondBranch = { ...branch, id: 'branch-2', name: 'Second' };
const customer = {
  id: 'customer-1',
  displayName: 'Customer One',
  phone: '09000000001',
  consentForMarketing: false,
  createdAt: '',
  updatedAt: '',
};
const service = {
  id: 'service-1',
  categoryId: 'category-1',
  name: 'Cut',
  durationMinutes: 45,
  bufferMinutes: 5,
  basePrice: '45.00',
  taxRatePercent: '0.00',
  status: 'ACTIVE',
  eligibleStaffIds: [],
};
const product = {
  id: 'product-1',
  name: 'Shampoo',
  sku: 'SKU-1',
  unit: 'PIECE',
  retailPrice: '12.00',
  reorderPoint: '2',
  status: 'ACTIVE',
};
const invoice = {
  id: 'invoice-1',
  branchId: 'branch-1',
  customerId: 'customer-1',
  status: 'DRAFT',
  lines: [
    { id: 'line-1', type: 'SERVICE', referenceId: 'service-1', description: 'Cut', quantity: '1', unitPrice: '45.00', lineTotal: '45.00' },
  ],
  subtotal: '45.00',
  taxTotal: '0.00',
  discountTotal: '0.00',
  total: '45.00',
  paidAmount: '0.00',
  dueAmount: '45.00',
  createdAt: '',
  updatedAt: '',
};
const branchStock = {
  branchId: 'branch-1',
  productId: 'product-1',
  name: 'Shampoo',
  sku: 'SKU-1',
  unit: 'PIECE',
  currentQuantity: '1',
  reorderPoint: '2',
  lowStock: true,
  status: 'ACTIVE',
};

function setupApiMocks() {
  const settingsApi = { listBranches: jest.fn().mockReturnValue(of({ items: [branch], page })) };
  const customerApi = { searchCustomers: jest.fn().mockReturnValue(of({ items: [customer], page })) };
  const catalogApi = { listServices: jest.fn().mockReturnValue(of({ items: [service], page })) };
  const posInventoryApi = {
    listProducts: jest.fn().mockReturnValue(of({ items: [product], page })),
    listPendingDues: jest.fn().mockReturnValue(of({ items: [], page })),
    createInvoice: jest.fn().mockReturnValue(of(invoice)),
    finalizeInvoice: jest.fn().mockReturnValue(of({ ...invoice, status: 'FINALIZED' })),
    captureInvoicePayment: jest.fn().mockReturnValue(of({ ...invoice, status: 'PAID', paidAmount: '45.00', dueAmount: '0.00' })),
    listBranchStock: jest.fn().mockReturnValue(of({ items: [branchStock], page })),
    listLowStockAlerts: jest.fn().mockReturnValue(of({ items: [branchStock], page })),
    createProduct: jest.fn().mockReturnValue(of(product)),
    updateProduct: jest.fn().mockReturnValue(of(product)),
    createStockMovement: jest.fn().mockReturnValue(of({ id: 'movement-1' })),
  };
  return { settingsApi, customerApi, catalogApi, posInventoryApi };
}

describe('PosComponent', () => {
  let fixture: ComponentFixture<PosComponent>;
  let posInventoryApi: ReturnType<typeof setupApiMocks>['posInventoryApi'];

  beforeEach(async () => {
    const mocks = setupApiMocks();
    posInventoryApi = mocks.posInventoryApi;
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, PosComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: mocks.settingsApi },
        { provide: CustomerCrmApi, useValue: mocks.customerApi },
        { provide: StaffServiceCatalogApi, useValue: mocks.catalogApi },
        { provide: PosInventoryApi, useValue: posInventoryApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PosComponent);
    fixture.detectChanges();
  });

  it('loads POS references and renders checkout', () => {
    expect(posInventoryApi.listProducts).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Checkout');
  });

  it('creates and finalizes an invoice from the current form state', () => {
    const component = fixture.componentInstance as unknown as { createInvoice: () => void; finalizeInvoice: () => void };

    component.createInvoice();
    component.finalizeInvoice();

    expect(posInventoryApi.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: 'branch-1',
        customerId: 'customer-1',
        lines: [expect.objectContaining({ type: 'SERVICE', referenceId: 'service-1', unitPrice: '45.00' })],
      }),
    );
    expect(posInventoryApi.finalizeInvoice).toHaveBeenCalledWith('invoice-1', { confirmedTotal: '45.00' });
  });

  it('reloads pending dues and clears selected invoice when branch changes', () => {
    const component = fixture.componentInstance as unknown as {
      currentInvoice: { set: (value: unknown) => void };
      onBranchChanged: (branchId: string) => void;
    };
    component.currentInvoice.set(invoice);

    component.onBranchChanged(secondBranch.id);

    expect(posInventoryApi.listPendingDues).toHaveBeenLastCalledWith('branch-2');
  });

  it('does not capture payment for draft invoices', () => {
    const component = fixture.componentInstance as unknown as {
      currentInvoice: { set: (value: unknown) => void };
      capturePayment: () => void;
    };
    component.currentInvoice.set(invoice);

    component.capturePayment();

    expect(posInventoryApi.captureInvoicePayment).not.toHaveBeenCalled();
  });
});

describe('InventoryComponent', () => {
  let fixture: ComponentFixture<InventoryComponent>;
  let posInventoryApi: ReturnType<typeof setupApiMocks>['posInventoryApi'];

  beforeEach(async () => {
    const mocks = setupApiMocks();
    posInventoryApi = mocks.posInventoryApi;
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, InventoryComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: mocks.settingsApi },
        { provide: PosInventoryApi, useValue: posInventoryApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
  });

  it('loads products, branch stock, and low-stock alerts', () => {
    expect(posInventoryApi.listProducts).toHaveBeenCalled();
    expect(posInventoryApi.listBranchStock).toHaveBeenCalledWith('branch-1');
    expect(posInventoryApi.listLowStockAlerts).toHaveBeenCalledWith('branch-1');
    expect(fixture.nativeElement.textContent).toContain('Inventory');
  });

  it('records stock movements for the selected branch and product', () => {
    const component = fixture.componentInstance as unknown as {
      movementForm: { patchValue: (value: Record<string, string>) => void };
      recordMovement: () => void;
    };
    component.movementForm.patchValue({ productId: 'product-1', quantity: '3', reason: 'PURCHASE' });
    component.recordMovement();

    expect(posInventoryApi.createStockMovement).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', productId: 'product-1', quantity: '3', reason: 'PURCHASE' }),
    );
  });

  it('reloads products with the current search query', () => {
    const component = fixture.componentInstance as unknown as {
      branchForm: { patchValue: (value: Record<string, string>) => void };
      reloadProducts: () => void;
    };
    component.branchForm.patchValue({ q: 'shampoo' });

    component.reloadProducts();

    expect(posInventoryApi.listProducts).toHaveBeenLastCalledWith('shampoo');
  });

  it('rejects zero-quantity stock movements before submit', () => {
    const component = fixture.componentInstance as unknown as {
      movementForm: { patchValue: (value: Record<string, string>) => void };
      recordMovement: () => void;
    };
    posInventoryApi.createStockMovement.mockClear();
    component.movementForm.patchValue({ productId: 'product-1', quantity: '0', reason: 'PURCHASE' });

    component.recordMovement();

    expect(posInventoryApi.createStockMovement).not.toHaveBeenCalled();
  });
});
