import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ApiEnvelope } from '../salon-owner-settings/models/salon-owner-settings.models';
import {
  BranchStockPage,
  CheckoutContext,
  FinalizeInvoiceInput,
  Invoice,
  InvoiceInput,
  InvoicePage,
  PaymentInput,
  Product,
  ProductInput,
  ProductPage,
  StockMovement,
  StockMovementInput,
} from './models/pos-inventory.models';

function idempotencyHeaders(): { readonly headers: HttpHeaders } {
  const key = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { headers: new HttpHeaders({ 'Idempotency-Key': key }) };
}

@Injectable({ providedIn: 'root' })
export class PosInventoryApi {
  private readonly http = inject(HttpClient);
  private readonly posBaseUrl = '/api/partner/pos';
  private readonly inventoryBaseUrl = '/api/partner/inventory';

  getCheckoutContext(appointmentId?: string, customerId?: string): Observable<CheckoutContext> {
    let params = new HttpParams();
    if (appointmentId) {
      params = params.set('appointmentId', appointmentId);
    }
    if (customerId) {
      params = params.set('customerId', customerId);
    }
    return this.http
      .get<ApiEnvelope<CheckoutContext>>(`${this.posBaseUrl}/checkout-context`, { params })
      .pipe(map((response) => response.data));
  }

  createInvoice(input: InvoiceInput): Observable<Invoice> {
    return this.http.post<ApiEnvelope<Invoice>>(`${this.posBaseUrl}/invoices`, input).pipe(map((response) => response.data));
  }

  getInvoice(invoiceId: string): Observable<Invoice> {
    return this.http.get<ApiEnvelope<Invoice>>(`${this.posBaseUrl}/invoices/${invoiceId}`).pipe(map((response) => response.data));
  }

  finalizeInvoice(invoiceId: string, input: FinalizeInvoiceInput): Observable<Invoice> {
    return this.http
      .post<ApiEnvelope<Invoice>>(`${this.posBaseUrl}/invoices/${invoiceId}/finalize`, input, idempotencyHeaders())
      .pipe(map((response) => response.data));
  }

  captureInvoicePayment(invoiceId: string, input: PaymentInput): Observable<Invoice> {
    return this.http
      .post<ApiEnvelope<Invoice>>(`${this.posBaseUrl}/invoices/${invoiceId}/payments`, input, idempotencyHeaders())
      .pipe(map((response) => response.data));
  }

  listPendingDues(branchId?: string): Observable<InvoicePage> {
    const params = branchId ? new HttpParams().set('branchId', branchId) : undefined;
    return this.http.get<ApiEnvelope<InvoicePage>>(`${this.posBaseUrl}/pending-dues`, { params }).pipe(map((response) => response.data));
  }

  listProducts(search?: string): Observable<ProductPage> {
    const params = search ? new HttpParams().set('q', search) : undefined;
    return this.http.get<ApiEnvelope<ProductPage>>(`${this.inventoryBaseUrl}/products`, { params }).pipe(map((response) => response.data));
  }

  createProduct(input: ProductInput): Observable<Product> {
    return this.http.post<ApiEnvelope<Product>>(`${this.inventoryBaseUrl}/products`, input).pipe(map((response) => response.data));
  }

  getProduct(productId: string): Observable<Product> {
    return this.http.get<ApiEnvelope<Product>>(`${this.inventoryBaseUrl}/products/${productId}`).pipe(map((response) => response.data));
  }

  updateProduct(productId: string, input: ProductInput): Observable<Product> {
    return this.http.patch<ApiEnvelope<Product>>(`${this.inventoryBaseUrl}/products/${productId}`, input).pipe(map((response) => response.data));
  }

  listBranchStock(branchId: string): Observable<BranchStockPage> {
    const params = new HttpParams().set('branchId', branchId);
    return this.http
      .get<ApiEnvelope<BranchStockPage>>(`${this.inventoryBaseUrl}/branch-stock`, { params })
      .pipe(map((response) => response.data));
  }

  createStockMovement(input: StockMovementInput): Observable<StockMovement> {
    return this.http
      .post<ApiEnvelope<StockMovement>>(`${this.inventoryBaseUrl}/stock-movements`, input, idempotencyHeaders())
      .pipe(map((response) => response.data));
  }

  adjustProductStock(productId: string, input: StockMovementInput): Observable<StockMovement> {
    return this.http
      .post<ApiEnvelope<StockMovement>>(`${this.inventoryBaseUrl}/products/${productId}/adjust-stock`, input, idempotencyHeaders())
      .pipe(map((response) => response.data));
  }

  listLowStockAlerts(branchId: string): Observable<BranchStockPage> {
    const params = new HttpParams().set('branchId', branchId);
    return this.http
      .get<ApiEnvelope<BranchStockPage>>(`${this.inventoryBaseUrl}/low-stock-alerts`, { params })
      .pipe(map((response) => response.data));
  }
}
