import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

import { Customer, CustomerInput, CustomerVisitHistoryItem } from './models/customer-crm.models';
import { CustomerCrmApi } from './customer-crm.api';

@Component({
  selector: 'lib-customer-crm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './customer-crm.component.html',
  styleUrls: ['./customer-crm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCrmComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CustomerCrmApi);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly customers = signal<readonly Customer[]>([]);
  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly visitHistory = signal<readonly CustomerVisitHistoryItem[]>([]);

  protected readonly searchForm = this.fb.nonNullable.group({
    q: [''],
  });

  protected readonly customerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', Validators.email],
    dateOfBirth: [''],
    consentForMarketing: [false],
  });

  protected readonly noteForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.maxLength(2000)]],
    visibility: this.fb.nonNullable.control<'INTERNAL' | 'STAFF_VISIBLE'>('STAFF_VISIBLE', Validators.required),
  });

  protected readonly preferencesForm = this.fb.nonNullable.group({
    smsEnabled: [false],
    emailEnabled: [false],
    whatsappEnabled: [false],
  });

  constructor() {
    this.searchCustomers();
  }

  protected searchCustomers(): void {
    this.loading.set(true);
    this.api.searchCustomers(this.searchForm.controls.q.value).subscribe({
      next: (result) => {
        this.customers.set(result.items);
        const selected = result.items.find((customer) => customer.id === this.selectedCustomer()?.id) ?? result.items[0] ?? null;
        if (selected) {
          this.selectCustomer(selected);
        } else {
          this.newCustomer();
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Customers could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerForm.reset({
      displayName: customer.displayName,
      phone: customer.phone,
      email: customer.email ?? '',
      dateOfBirth: customer.dateOfBirth ?? '',
      consentForMarketing: customer.consentForMarketing,
    });
    this.resetDependentForms(customer);
  }

  protected newCustomer(): void {
    this.selectedCustomer.set(null);
    this.customerForm.reset({
      displayName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      consentForMarketing: false,
    });
    this.resetDependentForms();
  }

  protected saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedCustomer();
    const input = this.normalizeCustomerInput();
    const request = selected ? this.api.updateCustomer(selected.id, input) : this.api.createCustomer(input);
    this.persist(request, (customer) => {
      this.selectedCustomer.set(customer);
      this.searchCustomers();
    });
  }

  protected saveNote(): void {
    const customer = this.selectedCustomer();
    if (!customer || this.noteForm.invalid) {
      this.error.set('Select a customer and enter a note.');
      return;
    }
    this.persist(this.api.createCustomerNote(customer.id, this.noteForm.getRawValue()), () =>
      this.noteForm.reset({ body: '', visibility: 'STAFF_VISIBLE' }),
    );
  }

  protected savePreferences(): void {
    const customer = this.selectedCustomer();
    if (!customer) {
      this.error.set('Select a customer before saving preferences.');
      return;
    }
    this.persist(this.api.updateCustomerCommunicationPreferences(customer.id, this.preferencesForm.getRawValue()));
  }

  protected loadVisitHistory(): void {
    const customer = this.selectedCustomer();
    if (!customer) {
      this.error.set('Select a customer before loading visit history.');
      return;
    }
    this.persist(this.api.getCustomerVisitHistory(customer.id), (history) => this.visitHistory.set(history.items));
  }

  protected visitTitle(visit: CustomerVisitHistoryItem): string {
    return visit.branchName ?? visit.branchId ?? 'Visit';
  }

  protected visitSummary(visit: CustomerVisitHistoryItem): string {
    return [visit.visitedAt ?? visit.startsAt, visit.status, visit.total].filter(Boolean).join(' · ');
  }

  private normalizeCustomerInput(): CustomerInput {
    const value = this.customerForm.getRawValue();
    return {
      displayName: value.displayName,
      phone: value.phone,
      email: value.email || undefined,
      dateOfBirth: value.dateOfBirth || undefined,
      consentForMarketing: value.consentForMarketing,
    };
  }

  private resetDependentForms(customer?: Customer): void {
    this.noteForm.reset({ body: '', visibility: 'STAFF_VISIBLE' });
    this.preferencesForm.reset({
      smsEnabled: customer?.smsEnabled ?? false,
      emailEnabled: customer?.emailEnabled ?? false,
      whatsappEnabled: customer?.whatsappEnabled ?? false,
    });
    this.visitHistory.set([]);
  }

  private persist<T>(request: Observable<T>, onSuccess?: (value: T) => void): void {
    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess?.(value);
        this.message.set('Customer saved.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Customer could not be saved.');
        this.saving.set(false);
      },
    });
  }
}
