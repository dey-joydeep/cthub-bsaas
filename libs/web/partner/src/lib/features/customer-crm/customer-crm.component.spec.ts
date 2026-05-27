import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CustomerCrmApi } from './customer-crm.api';
import { CustomerCrmComponent } from './customer-crm.component';

describe('CustomerCrmComponent', () => {
  let fixture: ComponentFixture<CustomerCrmComponent>;
  const api = {
    searchCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    createCustomerNote: vi.fn(),
    updateCustomerCommunicationPreferences: vi.fn(),
    getCustomerVisitHistory: vi.fn(),
  };

  beforeEach(async () => {
    api.searchCustomers.mockReturnValue(
      of({
        items: [
          {
            id: 'customer-1',
            displayName: 'Customer One',
            phone: '09000000001',
            email: 'customer@example.com',
            dateOfBirth: '1990-01-01',
            consentForMarketing: true,
            smsEnabled: true,
            emailEnabled: false,
            whatsappEnabled: true,
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    api.createCustomerNote.mockReturnValue(of({ body: 'Prefers morning', visibility: 'STAFF_VISIBLE' }));
    api.updateCustomerCommunicationPreferences.mockReturnValue(of({ smsEnabled: true, emailEnabled: false, whatsappEnabled: false }));
    api.getCustomerVisitHistory.mockReturnValue(
      of({
        items: [{ id: 'visit-1', branchName: 'Main', visitedAt: '2026-05-26T09:00:00.000Z', status: 'COMPLETED', total: '45.00' }],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, CustomerCrmComponent],
      providers: [{ provide: CustomerCrmApi, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCrmComponent);
    fixture.detectChanges();
  });

  it('loads customers on initialization', () => {
    expect(api.searchCustomers).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Customer One');
  });

  it('saves notes for the selected customer', () => {
    const component = fixture.componentInstance as unknown as {
      noteForm: { patchValue: (value: Record<string, string>) => void };
      saveNote: () => void;
    };
    component.noteForm.patchValue({ body: 'Prefers morning', visibility: 'STAFF_VISIBLE' });
    component.saveNote();

    expect(api.createCustomerNote).toHaveBeenCalledWith('customer-1', { body: 'Prefers morning', visibility: 'STAFF_VISIBLE' });
  });

  it('saves communication preferences for the selected customer', () => {
    const component = fixture.componentInstance as unknown as { savePreferences: () => void };
    component.savePreferences();

    expect(api.updateCustomerCommunicationPreferences).toHaveBeenCalledWith('customer-1', {
      smsEnabled: true,
      emailEnabled: false,
      whatsappEnabled: true,
    });
  });

  it('resets dependent forms when switching customers', () => {
    const component = fixture.componentInstance as unknown as {
      noteForm: { patchValue: (value: Record<string, string>) => void; controls: { body: { value: string } } };
      preferencesForm: {
        patchValue: (value: Record<string, boolean>) => void;
        getRawValue: () => { smsEnabled: boolean; emailEnabled: boolean; whatsappEnabled: boolean };
      };
      visitHistory: { set: (value: readonly unknown[]) => void; (): readonly unknown[] };
      selectCustomer: (customer: {
        id: string;
        displayName: string;
        phone: string;
        consentForMarketing: boolean;
        smsEnabled?: boolean;
        emailEnabled?: boolean;
        whatsappEnabled?: boolean;
        createdAt: string;
        updatedAt: string;
      }) => void;
    };
    component.noteForm.patchValue({ body: 'Draft for previous customer' });
    component.preferencesForm.patchValue({ smsEnabled: false, emailEnabled: true, whatsappEnabled: false });
    component.visitHistory.set([{ id: 'old-visit' }]);

    component.selectCustomer({
      id: 'customer-2',
      displayName: 'Customer Two',
      phone: '09000000002',
      consentForMarketing: false,
      smsEnabled: false,
      emailEnabled: true,
      whatsappEnabled: false,
      createdAt: '',
      updatedAt: '',
    });

    expect(component.noteForm.controls.body.value).toBe('');
    expect(component.preferencesForm.getRawValue()).toEqual({ smsEnabled: false, emailEnabled: true, whatsappEnabled: false });
    expect(component.visitHistory()).toEqual([]);
  });

  it('loads and renders visit history for the selected customer', () => {
    const component = fixture.componentInstance as unknown as { loadVisitHistory: () => void };

    component.loadVisitHistory();
    fixture.detectChanges();

    expect(api.getCustomerVisitHistory).toHaveBeenCalledWith('customer-1');
    expect(fixture.nativeElement.textContent).toContain('Main');
    expect(fixture.nativeElement.textContent).toContain('COMPLETED');
  });
});
