import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { TopSalonsComponent } from './top-salons.component';
import { TopSalonsService as SalonService } from './top-salons.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { PLATFORM_UTILS_TOKEN, type PlatformUtils } from '@cthub-bsaas/web-core-platform';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { createBrowserPlatformUtilsMock, createServerPlatformUtilsMock } from '@cthub-bsaas/web-core-testing';

describe('TopSalonsComponent', () => {
  let component: TopSalonsComponent;
  let fixture: ComponentFixture<TopSalonsComponent>;
  let salonService: vi.Mocked<SalonService>;
  let platformUtils: PlatformUtils;

  beforeEach(waitForAsync(() => {
    salonService = {
      getTopSalons: vi.fn(),
    };

    // Provide the mock service
    // Create a browser environment mock by default
    platformUtils = createBrowserPlatformUtilsMock();

    TestBed.overrideProvider(SalonService, { useValue: salonService });
    TestBed.configureTestingModule({
      imports: [TopSalonsComponent],
      providers: [
        { provide: SalonService, useValue: salonService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PLATFORM_UTILS_TOKEN, useValue: platformUtils },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopSalonsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('SSR compatibility', () => {
    it('should handle server-side rendering', () => {
      TestBed.resetTestingModule();
      const serverUtils = createServerPlatformUtilsMock();
      TestBed.configureTestingModule({
        imports: [TopSalonsComponent],
        providers: [
          { provide: SalonService, useValue: salonService },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: PLATFORM_UTILS_TOKEN, useValue: serverUtils },
        ],
      });

      const mockSalons = [{ id: '1', name: 'Test Salon' }];
      salonService.getTopSalons.mockReturnValue(of(mockSalons));

      fixture = TestBed.createComponent(TopSalonsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.salons()).toEqual(mockSalons);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(serverUtils.isBrowser).toBe(false);
    });

    it('should handle geolocation in browser environment', fakeAsync(() => {
      TestBed.resetTestingModule();
      const browserUtils = createBrowserPlatformUtilsMock();
      TestBed.configureTestingModule({
        imports: [TopSalonsComponent],
        providers: [
          { provide: SalonService, useValue: salonService },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: PLATFORM_UTILS_TOKEN, useValue: browserUtils },
        ],
      });

      const mockSalons = [{ id: '1', name: 'Test Salon' }];
      salonService.getTopSalons.mockReturnValue(of(mockSalons));

      const geoSpy = vi.spyOn(browserUtils.windowRef!.navigator.geolocation, 'getCurrentPosition');
      fixture = TestBed.createComponent(TopSalonsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(geoSpy).toHaveBeenCalled();
      tick();

      expect(salonService.getTopSalons).toHaveBeenCalledWith(40.7128, -74.006);
      expect(component.salons()).toEqual(mockSalons);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('should handle geolocation errors gracefully', fakeAsync(() => {
      TestBed.resetTestingModule();
      const errorUtils = createBrowserPlatformUtilsMock();

      if (errorUtils.windowRef?.navigator?.geolocation) {
        const errorObj: Partial<GeolocationPositionError> & { code: number; message: string } = {
          code: 1,
          message: 'Geolocation error',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };

        errorUtils.windowRef.navigator.geolocation.getCurrentPosition = (_: PositionCallback, error: PositionErrorCallback) => {
          error(errorObj as unknown as GeolocationPositionError);
        };
      }

      TestBed.configureTestingModule({
        imports: [TopSalonsComponent],
        providers: [
          { provide: SalonService, useValue: salonService },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: PLATFORM_UTILS_TOKEN, useValue: errorUtils },
        ],
      });

      const mockSalons = [{ id: '1', name: 'Test Salon' }];
      salonService.getTopSalons.mockReturnValue(of(mockSalons));

      fixture = TestBed.createComponent(TopSalonsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(salonService.getTopSalons).toHaveBeenCalledWith(undefined, undefined);
      expect(component.salons()).toEqual(mockSalons);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));
  });

  it('should load salons on init (success)', fakeAsync(() => {
    const salons = [
      {
        id: '1',
        name: 'Salon A',
        slug: 'salon-a',
        description: 'Test salon',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        city: 'Test City',
        isOpen: true,
        isFeatured: false,
        averageRating: 4.5,
        reviewCount: 10,
        featuredImage: 'test.jpg',
        imageUrl: 'test.jpg',
        services: [
          {
            id: '1',
            name: 'Test Service',
            price: 50,
            duration: 60,
            description: 'Test service description',
          },
        ],
        gallery: [],
      },
    ];

    salonService.getTopSalons.mockReturnValue(of(salons));
    component.fetchTopSalons();
    tick();
    fixture.detectChanges();
    expect(component.salons().length).toBe(1);
    expect(component.salons()[0].name).toBe('Salon A');
    expect(component.loading).toBe(false);
  }));

  it('should handle error on salon load', fakeAsync(() => {
    salonService.getTopSalons.mockReturnValue(throwError(() => new Error('Failed to fetch salons')));
    component.fetchTopSalons();
    tick();
    fixture.detectChanges();
    expect(component.error).toBe('Failed to load top salons. Please try again later.');
    expect(component.loading).toBe(false);
  }));
});
