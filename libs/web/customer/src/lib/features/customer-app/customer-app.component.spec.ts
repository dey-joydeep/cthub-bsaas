import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { CustomerAppApi } from './customer-app.api';
import { CustomerAppComponent } from './customer-app.component';
import type { CustomerBookingContext, CustomerDashboard } from './customer-app.models';

const page = { items: [], page: { limit: 20, nextCursor: null, hasMore: false } };

function contextFor(businessId: string): CustomerBookingContext {
  const suffix = businessId.endsWith('2') ? '2' : '1';
  return {
    salon: { businessId, name: `Salon ${suffix}` },
    branches: [{ branchId: `branch-${suffix}`, name: `Branch ${suffix}`, timezone: 'Asia/Tokyo', currency: 'JPY' }],
    services: [{ serviceId: `service-${suffix}`, name: `Service ${suffix}`, durationMinutes: 45, price: '35.00' }],
    staffOptions: [{ staffId: `staff-${suffix}`, displayName: `Staff ${suffix}` }],
    policySummary: { bookingLeadMinutes: 30, cancellationCutoffMinutes: 120 },
    availableDateRange: { from: '2026-05-26', to: '2026-06-26' },
  };
}

describe('CustomerAppComponent', () => {
  let fixture: ComponentFixture<CustomerAppComponent>;
  const queryParamMap = new BehaviorSubject(convertToParamMap({}));
  const dashboard: CustomerDashboard = {
    upcomingAppointment: null,
    recentVisits: [],
    rewardSummary: { pointsBalance: 0, tier: 'Base' },
    pendingReceipts: [],
    recommendedSalons: [{ businessId: 'business-1', name: 'Salon 1' }],
  };
  const api = {
    getDashboard: jest.fn(),
    listAppointments: jest.fn(),
    listFavorites: jest.fn(),
    listRewards: jest.fn(),
    listReceipts: jest.fn(),
    getBookingContext: jest.fn(),
    createBooking: jest.fn(),
    cancelAppointment: jest.fn(),
    submitReview: jest.fn(),
    upsertFavorite: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queryParamMap.next(convertToParamMap({}));
    api.getDashboard.mockReturnValue(of(dashboard));
    api.listAppointments.mockReturnValue(of(page));
    api.listFavorites.mockReturnValue(of(page));
    api.listRewards.mockReturnValue(of(page));
    api.listReceipts.mockReturnValue(of(page));
    api.getBookingContext.mockImplementation((query: { businessId?: string }) => of(contextFor(query.businessId ?? 'business-1')));

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, CustomerAppComponent],
      providers: [
        { provide: CustomerAppApi, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ view: 'book' }),
            queryParamMap: queryParamMap.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerAppComponent);
    fixture.detectChanges();
  });

  it('clears stale branch and service selections when the salon query changes', () => {
    expect(fixture.componentInstance.bookingForm.getRawValue()).toMatchObject({
      businessId: 'business-1',
      branchId: 'branch-1',
      serviceIds: ['service-1'],
    });

    queryParamMap.next(convertToParamMap({ businessId: 'business-2' }));

    expect(fixture.componentInstance.bookingForm.getRawValue()).toMatchObject({
      businessId: 'business-2',
      branchId: 'branch-2',
      serviceIds: ['service-2'],
      staffId: '',
    });
  });
});
