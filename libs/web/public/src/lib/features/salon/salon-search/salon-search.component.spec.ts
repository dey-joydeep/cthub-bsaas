import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { SalonSearchComponent } from './salon-search.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('SalonSearchComponent', () => {
  let component: SalonSearchComponent;
  let fixture: ComponentFixture<SalonSearchComponent>;
  let httpMock: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SalonSearchComponent,
        HttpClientTestingModule,
        FormsModule,
        TranslateModule.forRoot(),
        SafeUrlPipe,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [SafeUrlPipe, { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalonSearchComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
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
        rating: 3.5,
        reviewCount: 2,
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
    fixture.detectChanges();
    const cardEls = fixture.nativeElement.querySelectorAll('.salon-card .salon-name');
    expect(cardEls[0].textContent.trim()).toBe('A');
    expect(cardEls[1].textContent.trim()).toBe('B');
    expect(cardEls[2].textContent.trim()).toBe('C');
  });

  it('should show loading spinner while loading', () => {
    component.loading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show empty state if no salons found', waitForAsync(() => {
    component.ngOnInit();
    // Flush all /api/services requests
    httpMock.match((r) => r.url.includes('/api/services')).forEach((req) => req.flush([]));
    fixture.detectChanges();
    // Flush all /api/salons requests
    httpMock.match((r) => r.url.includes('/api/salons')).forEach((req) => req.flush({ salons: [], total: 0 }));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No salons found. Try adjusting your search or filters.');
  }));

  it('should toggle between list and map view', () => {
    component.salons = [{ id: '1', name: 'A', latitude: 0, longitude: 0 } as any];
    component.showMap = false;
    fixture.detectChanges();
    let map = fixture.nativeElement.querySelector('.salon-map-view iframe');
    expect(map).toBeFalsy();
    component.showMap = true;
    fixture.detectChanges();
    map = fixture.nativeElement.querySelector('.salon-map-view iframe');
    expect(map).toBeTruthy();
  });
});
