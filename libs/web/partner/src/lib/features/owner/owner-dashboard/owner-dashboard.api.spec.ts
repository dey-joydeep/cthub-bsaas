import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OwnerDashboardApi } from './owner-dashboard.api';

describe('OwnerDashboardApi', () => {
  let api: OwnerDashboardApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(OwnerDashboardApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('sends dashboard queries to documented endpoints', () => {
    api.getOwnerDashboard('branch-1', '2026-05-26').subscribe();
    const dashboard = http.expectOne((request) => request.url === '/api/partner/dashboard/owner');
    expect(dashboard.request.method).toBe('GET');
    expect(dashboard.request.params.get('branchId')).toBe('branch-1');
    expect(dashboard.request.params.get('date')).toBe('2026-05-26');
    dashboard.flush({
      success: true,
      data: {
        businessDate: '2026-05-26',
        branchId: 'branch-1',
        appointments: {},
        revenue: { gross: '0.00', paid: '0.00', due: '0.00' },
        inventoryAlerts: 0,
      },
    });

    api.listDashboardAlerts('branch-1').subscribe();
    const alerts = http.expectOne('/api/partner/dashboard/alerts?branchId=branch-1');
    expect(alerts.request.method).toBe('GET');
    alerts.flush({ success: true, data: { items: [], page: { limit: 0, nextCursor: null, hasMore: false } } });
  });

  it('omits branchId when requesting owner-wide dashboard data', () => {
    api.getOwnerDashboard(undefined, '2026-05-26').subscribe();
    const dashboard = http.expectOne('/api/partner/dashboard/owner?date=2026-05-26');
    expect(dashboard.request.method).toBe('GET');
    dashboard.flush({
      success: true,
      data: {
        businessDate: '2026-05-26',
        branchId: null,
        appointments: {},
        revenue: { gross: '0.00', paid: '0.00', due: '0.00' },
        inventoryAlerts: 0,
      },
    });

    api.listDashboardAlerts().subscribe();
    const alerts = http.expectOne('/api/partner/dashboard/alerts');
    expect(alerts.request.method).toBe('GET');
    alerts.flush({ success: true, data: { items: [], page: { limit: 0, nextCursor: null, hasMore: false } } });
  });
});
