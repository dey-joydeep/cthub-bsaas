import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PARTNER_API_BASE_URL } from '@cthub-bsaas/web-core-http';

import { SalonOwnerSettingsApi } from './salon-owner-settings.api';

describe('SalonOwnerSettingsApi', () => {
  let api: SalonOwnerSettingsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PARTNER_API_BASE_URL, useValue: 'http://localhost:3000/partner' },
      ],
    });
    api = TestBed.inject(SalonOwnerSettingsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads raw business list responses through the configured backend partner route', () => {
    let count = 0;
    api.listBusinesses().subscribe((result) => {
      count = result.items.length;
    });

    http
      .expectOne('http://localhost:3000/partner/businesses')
      .flush({ items: [{ id: 'business-1' }], page: { limit: 1, nextCursor: null, hasMore: false } });

    expect(count).toBe(1);
  });

  it('sends branch settings requests through the configured backend partner route', () => {
    api.getBranchHours('branch-1').subscribe();
    expect(http.expectOne('http://localhost:3000/partner/branches/branch-1/hours').request.method).toBe('GET');

    api.getBranchPolicy('branch-1').subscribe();
    expect(http.expectOne('http://localhost:3000/partner/branches/branch-1/policy').request.method).toBe('GET');

    api.replaceBranchHours('branch-1', { timezone: 'Asia/Tokyo', days: [] }).subscribe();
    expect(http.expectOne('http://localhost:3000/partner/branches/branch-1/hours').request.method).toBe('PUT');

    api.setBranchHoliday('branch-1', '2026-05-26', { closed: true, intervals: [] }).subscribe();
    expect(http.expectOne('http://localhost:3000/partner/branches/branch-1/holidays/2026-05-26').request.method).toBe('PUT');

    api
      .updateBranchPolicy('branch-1', {
        bookingLeadMinutes: 30,
        cancellationCutoffMinutes: 120,
        noShowGraceMinutes: 10,
      })
      .subscribe();
    expect(http.expectOne('http://localhost:3000/partner/branches/branch-1/policy').request.method).toBe('PUT');
  });
});
