import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TenantService } from './tenant.service';
import { Salon } from './model/tenant.model';

describe('TenantService', () => {
  let service: TenantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TenantService],
    });
    service = TestBed.inject(TenantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch salon successfully', () => {
    const mockSalon: Salon = {
      id: '1',
      name: 'Tenant Salon',
      address: '123 St',
      city: 'City',
      rating: 4.5,
      reviewCount: 10,
      imageUrl: 'url',
      services: [],
    };

    service.getSalon('1').subscribe((salon) => {
      expect(salon).toEqual(mockSalon);
    });

    const req = httpMock.expectOne('/api/salons/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockSalon);
  });

  it('should handle error when fetching salon', () => {
    service.getSalon('1').subscribe({
      next: () => fail('should have failed with 500 error'),
      error: (error: { userMessage?: string }) => {
        expect(error.userMessage).toBe('A server error occurred. Please try again later.');
      },
    });

    const req = httpMock.expectOne('/api/salons/1');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
