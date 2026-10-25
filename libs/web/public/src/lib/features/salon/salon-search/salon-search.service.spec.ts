import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { SalonSearchService } from './salon-search.service';
import { Salon } from './model/salon-search.model';

describe('SalonSearchService', () => {
  let service: SalonSearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SalonSearchService],
    });
    service = TestBed.inject(SalonSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search salons successfully', () => {
    const mockResponse: { salons: Salon[]; total: number } = {
      salons: [
        { id: '1', name: 'Salon Search', address: '123 St', city: 'City', rating: 4.8, reviewCount: 5, imageUrl: 'url', services: [] },
      ],
      total: 1,
    };
    const params = new HttpParams().set('city', 'City');

    service.searchSalons(params).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/salons?city=City');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle error when searching salons', () => {
    const params = new HttpParams().set('city', 'Invalid');
    service.searchSalons(params).subscribe({
      next: () => fail('should have failed with 500 error'),
      error: (error: any) => {
        expect(error.userMessage).toBe('A server error occurred. Please try again later.');
      },
    });

    const req = httpMock.expectOne('/api/salons?city=Invalid');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
