import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CustomerCrmApi } from './customer-crm.api';
import { CustomerCrmComponent } from './customer-crm.component';

describe('CustomerCrmComponent', () => {
  let fixture: ComponentFixture<CustomerCrmComponent>;
  const api = {
    searchCustomers: jest.fn(),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    createCustomerNote: jest.fn(),
    updateCustomerCommunicationPreferences: jest.fn(),
    getCustomerVisitHistory: jest.fn(),
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
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:00:00.000Z',
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    api.createCustomerNote.mockReturnValue(of({ body: 'Prefers morning', visibility: 'STAFF_VISIBLE' }));
    api.updateCustomerCommunicationPreferences.mockReturnValue(of({ smsEnabled: true, emailEnabled: false, whatsappEnabled: false }));

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
      smsEnabled: false,
      emailEnabled: false,
      whatsappEnabled: false,
    });
  });
});
