import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CustomerAppApi } from './customer-app.api';

describe('CustomerAppApi', () => {
  let api: CustomerAppApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomerAppApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CustomerAppApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the customer dashboard', () => {
    let tier = '';
    api.getDashboard().subscribe((dashboard) => {
      tier = dashboard.rewardSummary.tier;
    });

    const request = http.expectOne('/api/customer/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: {
        upcomingAppointment: null,
        recentVisits: [],
        rewardSummary: { pointsBalance: 120, tier: 'standard' },
        pendingReceipts: [],
        recommendedSalons: [],
      },
    });

    expect(tier).toBe('standard');
  });

  it('sends booking context query filters', () => {
    api.getBookingContext({ businessId: 'business-1', branchId: 'branch-1', serviceId: 'service-1' }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/customer/booking/context');
    expect(request.request.params.get('businessId')).toBe('business-1');
    expect(request.request.params.get('branchId')).toBe('branch-1');
    expect(request.request.params.get('serviceId')).toBe('service-1');
    request.flush({
      success: true,
      data: {
        salon: { businessId: 'business-1', name: 'Glow' },
        branches: [],
        services: [],
        staffOptions: [],
        policySummary: { bookingLeadMinutes: 0, cancellationCutoffMinutes: 0 },
        availableDateRange: { from: '2026-05-26T00:00:00.000Z', to: '2026-06-25T00:00:00.000Z' },
      },
    });
  });

  it('creates bookings with an idempotency key', () => {
    api
      .createBooking(
        {
          businessId: 'business-1',
          branchId: 'branch-1',
          serviceIds: ['service-1'],
          startAt: '2026-05-26T12:00:00.000Z',
        },
        'booking-key',
      )
      .subscribe();

    const request = http.expectOne('/api/customer/bookings');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('booking-key');
    expect(request.request.body.serviceIds).toEqual(['service-1']);
    request.flush({
      success: true,
      data: {
        appointmentId: 'appointment-1',
        status: 'BOOKED',
        startAt: '2026-05-26T12:00:00.000Z',
        endAt: '2026-05-26T12:30:00.000Z',
        salon: { businessId: 'business-1', name: 'Glow' },
        services: [],
        policySnapshot: { cancellationCutoffMinutes: 60 },
      },
    });
  });

  it('loads customer list resources', () => {
    api.listAppointments(10).subscribe((page) => expect(page.page.limit).toBe(10));
    api.listFavorites('salon').subscribe();
    api.listRewards('business-1').subscribe();
    api.listReceipts({ businessId: 'business-1', limit: 5 }).subscribe();

    http
      .expectOne((candidate) => candidate.url === '/api/customer/appointments' && candidate.params.get('limit') === '10')
      .flush({ success: true, data: [], meta: { page: { limit: 10, nextCursor: null, hasMore: false } } });
    http
      .expectOne((candidate) => candidate.url === '/api/customer/favorites' && candidate.params.get('targetType') === 'salon')
      .flush({ success: true, data: [], meta: { page: { limit: 20, nextCursor: null, hasMore: false } } });
    http
      .expectOne((candidate) => candidate.url === '/api/customer/rewards' && candidate.params.get('businessId') === 'business-1')
      .flush({ success: true, data: [], meta: { page: { limit: 20, nextCursor: null, hasMore: false } } });
    http
      .expectOne(
        (candidate) =>
          candidate.url === '/api/customer/receipts' &&
          candidate.params.get('businessId') === 'business-1' &&
          candidate.params.get('limit') === '5',
      )
      .flush({ success: true, data: [], meta: { page: { limit: 5, nextCursor: null, hasMore: false } } });
  });
});
