import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CustomerCrmApi } from './customer-crm.api';

describe('CustomerCrmApi', () => {
  let api: CustomerCrmApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(CustomerCrmApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps customer search envelopes and preserves query text', () => {
    let count = 0;
    api.searchCustomers('cust').subscribe((result) => {
      count = result.items.length;
    });

    const request = http.expectOne('/api/partner/customers?q=cust');
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: { items: [{ id: 'customer-1' }], page: { limit: 1, nextCursor: null, hasMore: false } },
    });
    expect(count).toBe(1);
  });

  it('sends customer commands to documented endpoints', () => {
    api.createCustomer({ displayName: 'Customer One', phone: '09000000001' }).subscribe();
    expect(http.expectOne('/api/partner/customers').request.method).toBe('POST');

    api.updateCustomer('customer-1', { displayName: 'Customer One', phone: '09000000001' }).subscribe();
    expect(http.expectOne('/api/partner/customers/customer-1').request.method).toBe('PATCH');

    api.createCustomerNote('customer-1', { body: 'Prefers morning', visibility: 'STAFF_VISIBLE' }).subscribe();
    expect(http.expectOne('/api/partner/customers/customer-1/notes').request.method).toBe('POST');

    api.updateCustomerCommunicationPreferences('customer-1', { smsEnabled: true, emailEnabled: false, whatsappEnabled: false }).subscribe();
    expect(http.expectOne('/api/partner/customers/customer-1/communication-preferences').request.method).toBe('PUT');

    api.getCustomerVisitHistory('customer-1').subscribe();
    expect(http.expectOne('/api/partner/customers/customer-1/visit-history').request.method).toBe('GET');
  });
});
