import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PublicDiscoveryApi } from './public-discovery.api';

describe('PublicDiscoveryApi', () => {
  let api: PublicDiscoveryApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicDiscoveryApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PublicDiscoveryApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('unwraps public home data', () => {
    let featuredCount = 0;
    api.getHome().subscribe((home) => {
      featuredCount = home.featuredSalons.length;
    });

    const request = http.expectOne('/api/public/home');
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      data: {
        featuredSalons: [
          {
            salonId: 'business-1',
            slug: 'glow-1',
            name: 'Glow',
            area: 'Tokyo',
            rating: '4.8',
            reviewCount: 9,
            startingPrice: '40.00',
            nextAvailability: null,
          },
        ],
        popularServices: [],
        nearbyAreas: [],
      },
    });

    expect(featuredCount).toBe(1);
  });

  it('sends search filters to public salons endpoint', () => {
    api.searchSalons({ q: 'cut', city: 'Tokyo', serviceId: 'service-1', ratingMin: 4, limit: 10, cursor: 'cursor-2' }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/public/salons');
    expect(request.request.params.get('q')).toBe('cut');
    expect(request.request.params.get('city')).toBe('Tokyo');
    expect(request.request.params.get('serviceId')).toBe('service-1');
    expect(request.request.params.get('ratingMin')).toBe('4');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('cursor')).toBe('cursor-2');
    request.flush({ success: true, data: { items: [], page: { limit: 10, nextCursor: null, hasMore: false } } });
  });

  it('loads profile detail collections', () => {
    api.getSalonProfile('glow-1').subscribe();
    api.listSalonServices('glow-1').subscribe();
    api.listSalonReviews('glow-1').subscribe();

    http
      .expectOne('/api/public/salons/glow-1')
      .flush({
        success: true,
        data: {
          salonId: 'business-1',
          slug: 'glow-1',
          name: 'Glow',
          description: null,
          branches: [],
          ratingSummary: { averageRating: '0.0', reviewCount: 0 },
          gallery: [],
        },
      });
    http
      .expectOne('/api/public/salons/glow-1/services')
      .flush({ success: true, data: { items: [], page: { limit: 20, nextCursor: null, hasMore: false } } });
    http
      .expectOne('/api/public/salons/glow-1/reviews')
      .flush({ success: true, data: { items: [], page: { limit: 20, nextCursor: null, hasMore: false } } });
  });
});
