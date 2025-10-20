import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { TopSalonsComponent } from './top-salons.component';
import { SalonService } from '../../services/salon.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { PLATFORM_UTILS_TOKEN, type PlatformUtils } from '@cthub-bsaas/web-config';
// Import mocks directly from the test-utils directory
const { createBrowserPlatformUtilsMock, createServerPlatformUtilsMock } = require('../../../../test-utils/mocks/platform-utils.mock');

describe('TopSalonsComponent', () => {
  let component: TopSalonsComponent;
  let fixture: ComponentFixture<TopSalonsComponent>;
  let salonService: jest.Mocked<SalonService>;
  let platformUtils: PlatformUtils;

  beforeEach(waitForAsync(() => {
    salonService = {
      getTopSalons: jest.fn(),
    } as unknown as jest.Mocked<SalonService>;

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
      // Create a server environment mock
      const serverUtils = createServerPlatformUtilsMock();

      // Override the provider with server environment
      TestBed.overrideProvider(PLATFORM_UTILS_TOKEN, { useValue: serverUtils });

      const mockSalons = [{ id: '1', name: 'Test Salon' }];
      salonService.getTopSalons.mockReturnValue(of(mockSalons));

      // Recreate component with server environment
      fixture = TestBed.createComponent(TopSalonsComponent);
      component = fixture.componentInstance;

      // Trigger change detection
      fixture.detectChanges();

      // Should still work without browser APIs
      expect(component.salons).toEqual(mockSalons);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();

      // Server environment should not block data loading
      expect(serverUtils.isBrowser).toBe(false);
    });

    it('should handle geolocation in browser environment', fakeAsync(() => {
      const mockSalons = [{ id: '1', name: 'Test Salon' }];
      salonService.getTopSalons.mockReturnValue(of(mockSalons));

      // Recreate component with fresh browser environment
      const browserUtils = createBrowserPlatformUtilsMock();
      TestBed.overrideProvider(PLATFORM_UTILS_TOKEN, { useValue: browserUtils });

      fixture = TestBed.createComponent(TopSalonsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Should have called getCurrentPosition
      expect(browserUtils.windowRef?.navigator?.geolocation?.getCurrentPosition).toHaveBeenCalled();
      tick();

      // Should have called getTopSalons with coordinates
      expect(salonService.getTopSalons).toHaveBeenCalledWith(40.7128, -74.006);

      // Should update component state
      expect(component.salons).toEqual(mockSalons);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('should handle geolocation errors gracefully', fakeAsync(() => {
      // Create a browser mock with geolocation error
      const errorUtils = createBrowserPlatformUtilsMock();

      // Override geolocation to simulate error
      if (errorUtils.windowRef?.navigator?.geolocation) {
        // Create a proper GeolocationPositionError-like object
        const errorObj: Partial<GeolocationPositionError> & { code: number; message: string } = {
          code: 1, // PERMISSION_DENIED
          message: 'Geolocation error',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        };

        errorUtils.windowRef.navigator.geolocation.getCurrentPosition = (_: PositionCallback, error: PositionErrorCallback) => {
          // Cast the error object to unknown first, then to GeolocationPositionError
          error(errorObj as unknown as GeolocationPositionError);
        };
      }

      // Override the provider with error mock
      TestBed.overrideProvider(PLATFORM_UTILS_TOKEN, { useValue: errorUtils });

      const mockSalons = [{ id: '1', name: 'Test Salon' }];
      salonService.getTopSalons.mockReturnValue(of(mockSalons));

      fixture = TestBed.createComponent(TopSalonsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      // Should still load salons without location
      expect(salonService.getTopSalons).toHaveBeenCalledWith(undefined, undefined);
      expect(component.salons).toEqual(mockSalons);
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
    component.fetchTopSalons(); // Call directly to avoid geolocation
    tick();
    fixture.detectChanges();
    expect(component.salons.length).toBe(1);
    expect(component.salons[0].name).toBe('Salon A');
    expect(component.loading).toBeFalse();
  }));

  it('should handle error on salon load', fakeAsync(() => {
    salonService.getTopSalons.mockReturnValue(throwError(() => new Error('Failed to fetch salons')));
    component.fetchTopSalons(); // Call directly to avoid geolocation
    tick();
    fixture.detectChanges();
    console.log('component.error:', component.error);
    console.log('component.loading:', component.loading);
    expect(component.error).toBe('Failed to fetch salons');
    expect(component.loading).toBeFalse();
  }));
});
