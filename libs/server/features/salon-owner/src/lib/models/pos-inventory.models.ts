export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';

export interface InvoiceLineModel {
  readonly id: string;
  readonly type: string;
  readonly referenceId: string;
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly lineTotal: string;
}

export interface InvoiceModel {
  readonly id: string;
  readonly branchId: string;
  readonly customerId: string;
  readonly appointmentId?: string;
  readonly status: InvoiceStatus;
  readonly lines: readonly InvoiceLineModel[];
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly discountTotal: string;
  readonly total: string;
  readonly paidAmount: string;
  readonly dueAmount: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductModel {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly unit: string;
  readonly retailPrice: string;
  readonly reorderPoint?: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
}

export interface BranchStockModel {
  readonly branchId: string;
  readonly productId: string;
  readonly name: string;
  readonly sku: string;
  readonly unit: string;
  readonly currentQuantity: string;
  readonly reorderPoint?: string;
  readonly lowStock: boolean;
  readonly status: 'ACTIVE' | 'INACTIVE';
}

export interface StockMovementModel {
  readonly id: string;
  readonly branchId: string;
  readonly productId: string;
  readonly quantity: string;
  readonly reason: string;
  readonly note?: string;
  readonly createdAt: string;
}
