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
        { provide: PARTNER_API_BASE_URL, useValue: '/api/partner' },
      ],
    });
    api = TestBed.inject(SalonOwnerSettingsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps business list envelopes through the configured backend partner route', () => {
    let count = 0;
    api.listBusinesses().subscribe((result) => {
      count = result.items.length;
    });

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/partner/businesses' &&
        candidate.params.get('page') === '1' &&
        candidate.params.get('pageSize') === '100',
    );
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      success: true,
      data: { items: [{ id: 'business-1' }] },
      meta: { page: 1, pageSize: 1, total: 1 },
    });

    expect(count).toBe(1);
  });

  it('sends idempotency keys on create requests', () => {
    api
      .createBusiness({
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
      })
      .subscribe();

    const businessRequest = http.expectOne('/api/partner/businesses');
    expect(businessRequest.request.method).toBe('POST');
    expect(businessRequest.request.withCredentials).toBe(true);
    expect(businessRequest.request.headers.get('Idempotency-Key')).toEqual(expect.any(String));
    businessRequest.flush({
      success: true,
      data: {
        id: 'business-1',
        tenantId: 'tenant-1',
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
        createdAt: '2026-06-20T00:00:00.000Z',
        updatedAt: '2026-06-20T00:00:00.000Z',
      },
    });

    api
      .createBranch({
        businessId: 'business-1',
        name: 'Main',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      })
      .subscribe();

    const branchRequest = http.expectOne('/api/partner/branches');
    expect(branchRequest.request.method).toBe('POST');
    expect(branchRequest.request.headers.get('Idempotency-Key')).toEqual(expect.any(String));
    branchRequest.flush({
      success: true,
      data: {
        id: 'branch-1',
        businessId: 'business-1',
        name: 'Main',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
        createdAt: '2026-06-20T00:00:00.000Z',
        updatedAt: '2026-06-20T00:00:00.000Z',
      },
    });
  });

  it('pages through business listings until all businesses are loaded', () => {
    let businessIds: string[] = [];
    api.listBusinesses().subscribe((result) => {
      businessIds = result.items.map((business) => business.id);
    });

    const firstRequest = http.expectOne(
      (request) =>
        request.url === '/api/partner/businesses' &&
        request.params.get('page') === '1' &&
        request.params.get('pageSize') === '100',
    );
    firstRequest.flush({
      success: true,
      data: { items: [{ id: 'business-1' }] },
      meta: { page: 1, pageSize: 100, total: 101 },
    });

    const secondRequest = http.expectOne(
      (request) =>
        request.url === '/api/partner/businesses' &&
        request.params.get('page') === '2' &&
        request.params.get('pageSize') === '100',
    );
    secondRequest.flush({
      success: true,
      data: { items: [{ id: 'business-101' }] },
      meta: { page: 2, pageSize: 100, total: 101 },
    });

    expect(businessIds).toEqual(['business-1', 'business-101']);
  });

  it('pages through branch listings until all branches are loaded', () => {
    let branchIds: string[] = [];
    api.listBranches('business-1').subscribe((result) => {
      branchIds = result.items.map((branch) => branch.id);
    });

    const firstRequest = http.expectOne(
      (request) =>
        request.url === '/api/partner/branches' &&
        request.params.get('businessId') === 'business-1' &&
        request.params.get('page') === '1' &&
        request.params.get('pageSize') === '100',
    );
    firstRequest.flush({
      success: true,
      data: { items: [{ id: 'branch-1' }] },
      meta: { page: 1, pageSize: 100, total: 101 },
    });

    const secondRequest = http.expectOne(
      (request) =>
        request.url === '/api/partner/branches' &&
        request.params.get('businessId') === 'business-1' &&
        request.params.get('page') === '2' &&
        request.params.get('pageSize') === '100',
    );
    secondRequest.flush({
      success: true,
      data: { items: [{ id: 'branch-101' }] },
      meta: { page: 2, pageSize: 100, total: 101 },
    });

    expect(branchIds).toEqual(['branch-1', 'branch-101']);
  });

  it('sends branch settings requests through the configured backend partner route', () => {
    api.getBranchHours('branch-1').subscribe();
    expect(http.expectOne('/api/partner/branches/branch-1/hours').request.method).toBe('GET');

    api.getBranchPolicy('branch-1').subscribe();
    expect(http.expectOne('/api/partner/branches/branch-1/policy').request.method).toBe('GET');

    api
      .replaceBranchHours('branch-1', {
        timezone: 'Asia/Tokyo',
        acknowledgeExistingAppointmentsOutsideHours: true,
        days: [],
      })
      .subscribe();
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
