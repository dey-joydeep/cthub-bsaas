import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SalonOwnerSettingsApi } from './salon-owner-settings.api';

describe('SalonOwnerSettingsApi', () => {
  let api: SalonOwnerSettingsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SalonOwnerSettingsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps business list envelopes', () => {
    let count = 0;
    api.listBusinesses().subscribe((result) => {
      count = result.items.length;
    });

    http.expectOne('/api/partner/businesses').flush({
      success: true,
      data: { items: [{ id: 'business-1' }], page: { limit: 1, nextCursor: null, hasMore: false } },
    });

    expect(count).toBe(1);
  });

  it('sends branch schedule commands to the documented endpoints', () => {
    api.replaceBranchHours('branch-1', { timezone: 'Asia/Tokyo', days: [] }).subscribe();
    expect(http.expectOne('/api/partner/branches/branch-1/hours').request.method).toBe('PUT');

    api.setBranchHoliday('branch-1', '2026-05-26', { closed: true, intervals: [] }).subscribe();
    expect(http.expectOne('/api/partner/branches/branch-1/holidays/2026-05-26').request.method).toBe('PUT');

    api
      .updateBranchPolicy('branch-1', {
        bookingLeadMinutes: 30,
        cancellationCutoffMinutes: 120,
        noShowGraceMinutes: 10,
      })
      .subscribe();
    expect(http.expectOne('/api/partner/branches/branch-1/policy').request.method).toBe('PUT');
  });
});
