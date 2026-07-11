import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SalonManagementComponent } from './salon-management.component';
import { SalonService } from './salon.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { User } from '../../models/user.model';

describe('SalonManagementComponent', () => {
  let component: SalonManagementComponent;
  let fixture: ComponentFixture<SalonManagementComponent>;
  let salonService: vi.Mocked<SalonService>;

  beforeEach(async () => {
    salonService = {
      saveSalon: vi.fn(),
      getSalons: vi.fn(),
      getSalon: vi.fn(),
      deleteSalon: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatIconModule,
        MatSelectModule,
        MatChipsModule,
        SalonManagementComponent,
      ],
      providers: [{ provide: SalonService, useValue: salonService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SalonManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed salon save', fakeAsync(() => {
    const errorResponse = {
      error: {
        message: 'Failed to save salon.',
      },
    };
    salonService.saveSalon.mockReturnValue(throwError(() => errorResponse));

    component.salonForm.patchValue({
      name: 'Test Salon',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      phone: '555-123-4567',
      email: 'test@example.com',
      latitude: 40.7128,
      longitude: -74.006,
      services: ['Haircut', 'Coloring'],
      ownerId: 'test-owner-id',
      logoUrl: 'https://example.com/test.jpg',
    });

    component.onSubmit();
    tick();

    expect(component.error).toBe('Failed to save salon.');
    expect(component.loading).toBe(false);
  }));

  it('should display error if required fields are missing', () => {
    component.salonForm.patchValue({
      name: '',
      address: '',
      city: '',
      zipCode: '',
      latitude: null,
      longitude: null,
      services: [],
      ownerId: '',
    });

    component.onSubmit();

    expect(component.salonForm.invalid).toBe(true);
    expect(salonService.saveSalon).not.toHaveBeenCalled();
  });

  it('should call saveSalon with correct data on valid form submission', fakeAsync(() => {
    const mockResponse = { success: true };
    salonService.saveSalon.mockReturnValue(of(mockResponse));

    component.salonForm.patchValue({
      name: 'Test Salon',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      phone: '555-123-4567',
      email: 'test@example.com',
      latitude: 40.7128,
      longitude: -74.006,
      services: ['Haircut', 'Coloring'],
      ownerId: 'test-owner-id',
    });

    component.onSubmit();
    tick();

    expect(salonService.saveSalon).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Salon',
        address: '123 Test St',
        city: 'Test City',
        zipCode: '12345',
        latitude: 40.7128,
        longitude: -74.006,
        services: ['Haircut', 'Coloring'],
      }),
    );

    expect(component.success).toBe('Salon saved successfully!');
    expect(component.loading).toBe(false);
  }));

  it('should add and remove services correctly', () => {
    // Test adding a service
    const event = { preventDefault: vi.fn() } as unknown as Event;
    component.onAddService('Haircut', event);
    expect(component.salonForm.get('services')?.value).toContain('Haircut');
    expect(event.preventDefault).toHaveBeenCalled();

    // Test removing a service
    component.onRemoveService('Haircut');
    expect(component.salonForm.get('services')?.value).not.toContain('Haircut');
  });

  it('should reset form after successful submission', fakeAsync(() => {
    const mockResponse = { success: true };
    salonService.saveSalon.mockReturnValue(of(mockResponse));

    component.salonForm.patchValue({
      name: 'Test Salon',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      phone: '555-123-4567',
      email: 'test@example.com',
      latitude: 40.7128,
      longitude: -74.006,
      services: ['Haircut', 'Coloring'],
      ownerId: 'test-owner-id',
    });

    component.onSubmit();
    tick();

    expect(component.salonForm.get('name')?.value).toBeNull();
    expect(component.salonForm.get('services')?.value).toEqual([]);
    expect(component.salonForm.get('ownerId')?.value).toBe('current-user-id');
  }));

  it('should handle geolocation when getting current location', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    });
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    // Mock the geolocation API
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success) => {
      success(mockPosition as GeolocationPosition);
    });

    component.onUseCurrentLocation();

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(component.salonForm.get('latitude')?.value).toBe(mockPosition.coords.latitude);
    expect(component.salonForm.get('longitude')?.value).toBe(mockPosition.coords.longitude);
  });

  it('should handle geolocation error', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    });
    const mockError = {
      code: 1,
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    // Mock the geolocation API with error
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success, error) => {
      error?.(mockError as GeolocationPositionError);
    });

    component.onUseCurrentLocation();

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(component.error).toBe('Could not get your current location. Please enter it manually.');
  });
});
