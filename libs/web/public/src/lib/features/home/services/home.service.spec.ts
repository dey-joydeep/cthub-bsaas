import { TestBed } from '@angular/core/testing';
import { HomeService } from './home.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { IHomePageData, ICityDto } from './home.models';

describe('HomeService', () => {
  let service: HomeService;
  let httpMock: HttpTestingController;
  const apiBaseUrl = '/api/home';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HomeService],
    });
    service = TestBed.inject(HomeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getHomePageData', () => {
    it('should return home data', () => {
      const mockData = {
        featuredSalons: [],
        featuredServices: [],
        testimonials: [],
        cities: [],
      };

      service.getHomePageData().subscribe((data: IHomePageData) => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(apiBaseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle error responses', () => {
      service.getHomePageData().subscribe({
        next: () => fail('should have errored'),
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(apiBaseUrl);
      req.flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('searchSalons', () => {
    it('should call search with correct parameters', () => {
      const query = 'test';
      const filters = {
        cityId: '1',
        page: 1,
        limit: 10,
      };

      service.searchSalons(query, filters).subscribe();

      const req = httpMock.expectOne(
        (req) =>
          req.url === `${apiBaseUrl}/search` &&
          req.params.get('q') === query &&
          req.params.get('cityId') === filters.cityId &&
          req.params.get('page') === filters.page.toString() &&
          req.params.get('limit') === filters.limit.toString(),
      );

      expect(req.request.method).toBe('GET');
      req.flush({ data: [], total: 0 });
    });
  });

  describe('getFeaturedSalons', () => {
    it('should fetch featured salons with default limit', () => {
      service.getFeaturedSalons().subscribe();

      const req = httpMock.expectOne(`${apiBaseUrl}/featured-salons`);
      expect(req.request.params.get('limit')).toBe('10');
      req.flush([]);
    });

    it('should fetch featured salons', () => {
      service.getFeaturedSalons().subscribe();

      const req = httpMock.expectOne(`${apiBaseUrl}/featured-salons`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getCities', () => {
    it('should fetch cities', () => {
      const mockCities: ICityDto[] = [
        {
          id: '1',
          name: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          isActive: true,
          salonCount: 5,
        },
      ];

      service.getCities().subscribe((cities) => {
        expect(cities).toEqual(mockCities);
      });

      const req = httpMock.expectOne(`${apiBaseUrl}/cities`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCities);
    });
  });

  // Removed getLanguages test as it doesn't exist in the service
});
