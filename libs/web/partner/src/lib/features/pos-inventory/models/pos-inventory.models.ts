import type { PagedEnvelope } from '../../salon-owner-settings/models/salon-owner-settings.models';

export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
export type InvoiceLineType = 'SERVICE' | 'PRODUCT' | 'ADJUSTMENT';
export type ProductUnit = 'PIECE' | 'ML' | 'GRAM' | 'PACK';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type StockMovementReason = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'BANK_TRANSFER';

export interface InvoiceLineInput {
  readonly type: InvoiceLineType;
  readonly referenceId: string;
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
}

export interface InvoiceInput {
  readonly branchId: string;
  readonly customerId: string;
  readonly appointmentId?: string;
  readonly lines: readonly InvoiceLineInput[];
}

export interface FinalizeInvoiceInput {
  readonly confirmedTotal: string;
}

export interface PaymentInput {
  readonly amount: string;
  readonly method: PaymentMethod;
  readonly receivedAt: string;
  readonly reference?: string;
}

export interface InvoiceLine extends InvoiceLineInput {
  readonly id: string;
  readonly lineTotal: string;
}

export interface Invoice {
  readonly id: string;
  readonly branchId: string;
  readonly customerId: string;
  readonly appointmentId?: string;
  readonly status: InvoiceStatus;
  readonly lines: readonly InvoiceLine[];
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly discountTotal: string;
  readonly total: string;
  readonly paidAmount: string;
  readonly dueAmount: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CheckoutContext {
  readonly businessId: string;
  readonly appointmentId: string | null;
  readonly customerId: string | null;
}

export interface ProductInput {
  readonly name: string;
  readonly sku: string;
  readonly unit: ProductUnit;
  readonly retailPrice: string;
  readonly reorderPoint?: string;
  readonly status: ProductStatus;
}

export interface Product extends ProductInput {
  readonly id: string;
}

export interface BranchStock {
  readonly branchId: string;
  readonly productId: string;
  readonly name: string;
  readonly sku: string;
  readonly unit: ProductUnit;
  readonly currentQuantity: string;
  readonly reorderPoint?: string;
  readonly lowStock: boolean;
  readonly status: ProductStatus;
}

export interface StockMovementInput {
  readonly branchId: string;
  readonly productId: string;
  readonly quantity: string;
  readonly reason: StockMovementReason;
  readonly note?: string;
}

export interface StockMovement extends StockMovementInput {
  readonly id: string;
  readonly createdAt: string;
}

export type InvoicePage = PagedEnvelope<Invoice>;
export type ProductPage = PagedEnvelope<Product>;
export type BranchStockPage = PagedEnvelope<BranchStock>;
