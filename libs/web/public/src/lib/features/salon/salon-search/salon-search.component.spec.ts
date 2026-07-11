import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { SalonSearchComponent } from './salon-search.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { SafeUrlPipe } from '@cthub-bsaas/web-ui';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('SalonSearchComponent', () => {
  let component: SalonSearchComponent;
  let fixture: ComponentFixture<SalonSearchComponent>;
  let httpMock: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SalonSearchComponent, HttpClientTestingModule, FormsModule, SafeUrlPipe, RouterTestingModule.withRoutes([])],
      providers: [SafeUrlPipe, { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalonSearchComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.match((r) => r.url.includes('/api/services')).forEach((req) => req.flush([]));
    httpMock.match((r) => r.url.includes('/api/salons')).forEach((req) => req.flush({ salons: [], total: 0 }));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call backend with correct sort param', () => {
    component.sort = 'reviews';
    component.search();
    const req = httpMock.expectOne((r) => r.url.includes('/api/salons'));
    expect(req.request.params.get('sort')).toBe('reviews');
    req.flush({ salons: [], total: 0 });
  });

  it('should render salons in correct order after sorting', () => {
    const salons = [
      {
        id: '1',
        name: 'A',
        rating: 4.5,
        reviewCount: 10,
        address: '123 Main St',
        latitude: 0,
        longitude: 0,
        services: [],
        staff: [],
        ownerId: 'owner1',
        city: 'Test City',
        zipCode: '12345',
        imageUrl: 'http://example.com/image1.jpg',
        images: [],
        reviews: [],
        phone: '123-456-7890',
        description: 'Test salon A',
        slug: 'test-salon-a',
        country: 'Test Country',
        email: 'test@example.com',
        timezone: 'UTC',
        isActive: true,
        isVerified: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'B',
        rating: 4.0,
        reviewCount: 5,
        address: '456 Oak St',
        latitude: 0,
        longitude: 0,
        services: [],
        staff: [],
        ownerId: 'owner2',
        city: 'Test City',
        zipCode: '12345',
        imageUrl: 'http://example.com/image2.jpg',
        images: [],
        reviews: [],
        phone: '123-456-7890',
        description: 'Test salon B',
        slug: 'test-salon-b',
        country: 'Test Country',
        email: 'test@example.com',
        timezone: 'UTC',
        isActive: true,
        isVerified: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'C',
        rating: 4.8,
        reviewCount: 20,
        address: '789 Pine St',
        latitude: 0,
        longitude: 0,
        services: [],
        staff: [],
        ownerId: 'owner3',
        city: 'Test City',
        zipCode: '12345',
        imageUrl: 'http://example.com/image3.jpg',
        images: [],
        reviews: [],
        phone: '123-456-7890',
        description: 'Test salon C',
        slug: 'test-salon-c',
        country: 'Test Country',
        email: 'test@example.com',
        timezone: 'UTC',
        isActive: true,
        isVerified: true,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    component.salons = salons;
    component.sort = 'rating';
    component.onFilterChange();
    const req = httpMock.expectOne((r) => r.url.includes('/api/salons'));
    expect(req.request.params.get('sort')).toBe('rating');
    req.flush({ salons: [], total: 0 });
  });

  it('should show loading spinner while loading', () => {
    component.loading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show empty state if no salons found', () => {
    fixture.detectChanges();
    expect(component.loading).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No salons found. Try adjusting your search or filters.');
  });

  it('should toggle between list and map view', () => {
    component.salons = [{ id: '1', name: 'A', latitude: 0, longitude: 0 } as any];
    component.showMap = false;
    fixture.detectChanges();
    let map = fixture.nativeElement.querySelector('.salon-map-view iframe');
    expect(map).toBeFalsy();

    const toggleBtn = fixture.nativeElement.querySelector('.view-toggle-bar button');
    toggleBtn.click();
    fixture.detectChanges();

    map = fixture.nativeElement.querySelector('.salon-map-view iframe');
    expect(map).toBeTruthy();
  });
});
