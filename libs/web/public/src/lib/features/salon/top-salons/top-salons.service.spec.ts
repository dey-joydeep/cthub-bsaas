import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TopSalonsService } from './top-salons.service';
import { Salon } from './model/top-salons.model';

describe('TopSalonsService', () => {
  let service: TopSalonsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TopSalonsService],
    });
    service = TestBed.inject(TopSalonsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get top salons without coordinates', () => {
    const mockSalons: Salon[] = [
      { id: '1', name: 'Top Salon', address: '123 St', city: 'City', rating: 4.9, reviewCount: 20, imageUrl: 'url', distance: undefined },
    ];

    service.getTopSalons().subscribe((salons) => {
      expect(salons).toEqual(mockSalons);
    });

    const req = httpMock.expectOne('/api/salons/top');
    expect(req.request.method).toBe('GET');
    req.flush(mockSalons);
  });

  it('should get top salons with coordinates', () => {
    const mockSalons: Salon[] = [
      { id: '1', name: 'Top Salon', address: '123 St', city: 'City', rating: 4.9, reviewCount: 20, imageUrl: 'url', distance: 1.2 },
    ];

    service.getTopSalons(35.6895, 139.6917).subscribe((salons) => {
      expect(salons).toEqual(mockSalons);
    });

    const req = httpMock.expectOne('/api/salons/top?lat=35.6895&lng=139.6917');
    expect(req.request.method).toBe('GET');
    req.flush(mockSalons);
  });

  it('should handle error when getting top salons', () => {
    service.getTopSalons().subscribe({
      next: () => fail('should have failed with 500 error'),
      error: (error: any) => {
        expect(error.userMessage).toBe('A server error occurred. Please try again later.');
      },
    });

    const req = httpMock.expectOne('/api/salons/top');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
