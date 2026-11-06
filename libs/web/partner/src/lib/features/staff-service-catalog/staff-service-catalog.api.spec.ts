import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { StaffServiceCatalogApi } from './staff-service-catalog.api';

describe('StaffServiceCatalogApi', () => {
  let api: StaffServiceCatalogApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StaffServiceCatalogApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps staff lists and preserves branch filters', () => {
    let count = 0;
    api.listStaff('branch-1').subscribe((result) => {
      count = result.items.length;
    });

    const request = http.expectOne('/api/partner/staff?branchId=branch-1');
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: { items: [{ id: 'staff-1' }], page: { limit: 1, nextCursor: null, hasMore: false } },
    });
    expect(count).toBe(1);
  });

  it('sends staff replacement commands to documented endpoints', () => {
    api.replaceStaffRoles('staff-1', { roles: ['STYLIST'] }).subscribe();
    expect(http.expectOne('/api/partner/staff/staff-1/roles').request.method).toBe('PUT');

    api.replaceStaffSkills('staff-1', { serviceIds: ['service-1'] }).subscribe();
    expect(http.expectOne('/api/partner/staff/staff-1/skills').request.method).toBe('PUT');

    api
      .replaceStaffShifts('staff-1', {
        branchId: 'branch-1',
        timezone: 'Asia/Tokyo',
        days: [{ dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] }],
      })
      .subscribe();
    expect(http.expectOne('/api/partner/staff/staff-1/shifts').request.method).toBe('PUT');
  });

  it('sends service catalog commands to documented endpoints', () => {
    api.createServiceCategory({ name: 'Hair', sortOrder: 1 }).subscribe();
    expect(http.expectOne('/api/partner/service-categories').request.method).toBe('POST');

    api.listServices('category-1').subscribe();
    expect(http.expectOne('/api/partner/services?categoryId=category-1').request.method).toBe('GET');

    api.updateServiceStatus('service-1', { status: 'INACTIVE' }).subscribe();
    expect(http.expectOne('/api/partner/services/service-1/status').request.method).toBe('PUT');

    api.replaceServiceStaffEligibility('service-1', { staffIds: ['staff-1'] }).subscribe();
    expect(http.expectOne('/api/partner/services/service-1/staff-eligibility').request.method).toBe('PUT');
  });
});
