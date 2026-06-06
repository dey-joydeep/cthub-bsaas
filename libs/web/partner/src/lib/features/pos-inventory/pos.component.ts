import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable, forkJoin } from 'rxjs';

import { Customer } from '../customer-crm/models/customer-crm.models';
import { CustomerCrmApi } from '../customer-crm/customer-crm.api';
import { BranchProfile } from '../salon-owner-settings/models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { Service } from '../staff-service-catalog/models/staff-service-catalog.models';
import { StaffServiceCatalogApi } from '../staff-service-catalog/staff-service-catalog.api';
import { Invoice, InvoiceLineType, PaymentMethod, Product } from './models/pos-inventory.models';
import { PosInventoryApi } from './pos-inventory.api';

@Component({
  selector: 'lib-owner-pos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsApi = inject(SalonOwnerSettingsApi);
  private readonly customerApi = inject(CustomerCrmApi);
  private readonly catalogApi = inject(StaffServiceCatalogApi);
  private readonly posApi = inject(PosInventoryApi);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly customers = signal<readonly Customer[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly pendingDues = signal<readonly Invoice[]>([]);
  protected readonly currentInvoice = signal<Invoice | null>(null);

  protected readonly lineTypes: readonly InvoiceLineType[] = ['SERVICE', 'PRODUCT', 'ADJUSTMENT'];
  protected readonly paymentMethods: readonly PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'WALLET', 'BANK_TRANSFER'];

  protected readonly invoiceForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    customerId: ['', Validators.required],
    appointmentId: [''],
    type: this.fb.nonNullable.control<InvoiceLineType>('SERVICE', Validators.required),
    referenceId: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(160)]],
    quantity: ['1', [Validators.required, Validators.pattern(/^\d+(\.\d{1,3})?$/)]],
    unitPrice: ['0.00', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
  });

  protected readonly paymentForm = this.fb.nonNullable.group({
    amount: ['0.00', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    method: this.fb.nonNullable.control<PaymentMethod>('CASH', Validators.required),
    reference: [''],
  });

  constructor() {
    this.loadReferences();
  }

  protected useCatalogItem(kind: 'SERVICE' | 'PRODUCT', item: Service | Product): void {
    this.invoiceForm.patchValue({
      type: kind,
      referenceId: item.id,
      description: item.name,
      unitPrice: kind === 'SERVICE' ? (item as Service).basePrice : (item as Product).retailPrice,
    });
  }

  protected createInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }
    const value = this.invoiceForm.getRawValue();
    this.persist(
      this.posApi.createInvoice({
        branchId: value.branchId,
        customerId: value.customerId,
        appointmentId: value.appointmentId || undefined,
        lines: [
          {
            type: value.type,
            referenceId: value.referenceId,
            description: value.description,
            quantity: value.quantity,
            unitPrice: value.unitPrice,
          },
        ],
      }),
      (invoice) => {
        this.currentInvoice.set(invoice);
        this.paymentForm.patchValue({ amount: invoice.dueAmount });
        this.loadPendingDues(invoice.branchId);
      },
    );
  }

  protected finalizeInvoice(): void {
    const invoice = this.currentInvoice();
    if (!invoice) {
      this.error.set('Create or select an invoice before finalizing.');
      return;
    }
    this.persist(this.posApi.finalizeInvoice(invoice.id, { confirmedTotal: invoice.total }), (updated) => this.currentInvoice.set(updated));
  }

  protected capturePayment(): void {
    const invoice = this.currentInvoice();
    if (!invoice || this.paymentForm.invalid) {
      this.error.set('Select an invoice and enter payment details.');
      this.paymentForm.markAllAsTouched();
      return;
    }
    if (!this.isInvoicePayable(invoice)) {
      this.error.set('Finalize the invoice before capturing payment.');
      return;
    }
    const value = this.paymentForm.getRawValue();
    this.persist(
      this.posApi.captureInvoicePayment(invoice.id, {
        amount: value.amount,
        method: value.method,
        receivedAt: new Date().toISOString(),
        reference: value.reference || undefined,
      }),
      (updated) => {
        this.currentInvoice.set(updated);
        this.paymentForm.patchValue({ amount: updated.dueAmount });
        this.loadPendingDues(updated.branchId);
      },
    );
  }

  protected selectInvoice(invoice: Invoice): void {
    this.currentInvoice.set(invoice);
    this.paymentForm.patchValue({ amount: invoice.dueAmount });
  }

  protected onBranchChanged(branchId: string): void {
    this.currentInvoice.set(null);
    this.pendingDues.set([]);
    if (branchId) {
      this.loadPendingDues(branchId);
    }
  }

  protected isCurrentInvoicePayable(): boolean {
    const invoice = this.currentInvoice();
    return invoice ? this.isInvoicePayable(invoice) : false;
  }

  protected customerName(customerId: string): string {
    return this.customers().find((customer) => customer.id === customerId)?.displayName ?? customerId;
  }

  private loadReferences(): void {
    this.loading.set(true);
    forkJoin({
      branches: this.settingsApi.listBranches(),
      customers: this.customerApi.searchCustomers(),
      services: this.catalogApi.listServices(),
      products: this.posApi.listProducts(),
    }).subscribe({
      next: ({ branches, customers, services, products }) => {
        this.branches.set(branches.items);
        this.customers.set(customers.items);
        this.services.set(services.items);
        this.products.set(products.items);
        this.applyDefaults();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('POS references could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  private applyDefaults(): void {
    const branchId = this.branches()[0]?.id ?? '';
    this.invoiceForm.patchValue({
      branchId,
      customerId: this.customers()[0]?.id ?? '',
    });
    const service = this.services()[0];
    if (service) {
      this.useCatalogItem('SERVICE', service);
    }
    if (branchId) {
      this.loadPendingDues(branchId);
    }
  }

  private loadPendingDues(branchId: string): void {
    this.posApi.listPendingDues(branchId).subscribe({
      next: (result) => this.pendingDues.set(result.items),
      error: () => this.pendingDues.set([]),
    });
  }

  private isInvoicePayable(invoice: Invoice): boolean {
    return ['FINALIZED', 'PARTIALLY_PAID'].includes(invoice.status) && Number(invoice.dueAmount) > 0;
  }

  private persist<T>(request: Observable<T>, onSuccess: (value: T) => void): void {
    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess(value);
        this.message.set('POS updated.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('POS action could not be completed.');
        this.saving.set(false);
      },
    });
  }
}
