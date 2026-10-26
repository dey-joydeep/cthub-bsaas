import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SalonService } from './salon-list.service';
import { Salon } from './model/salon-list.model';

describe('SalonService (salon-list)', () => {
  let service: SalonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SalonService],
    });
    service = TestBed.inject(SalonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch salons successfully', () => {
    const mockSalons: Salon[] = [
      { id: '1', name: 'Salon One', address: '123 St', city: 'City', rating: 4.5, reviewCount: 10, imageUrl: 'url' },
    ];

    service.getSalons().subscribe((salons) => {
      expect(salons).toEqual(mockSalons);
    });

    const req = httpMock.expectOne('/api/salons');
    expect(req.request.method).toBe('GET');
    req.flush(mockSalons);
  });

  it('should handle error when fetching salons', () => {
    service.getSalons().subscribe({
      next: () => fail('should have failed with 500 error'),
      error: (error: any) => {
        expect(error.userMessage).toBe('A server error occurred. Please try again later.');
      },
    });

    const req = httpMock.expectOne('/api/salons');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
