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
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { User } from '../../models/user.model';

describe('SalonManagementComponent', () => {
  let component: SalonManagementComponent;
  let fixture: ComponentFixture<SalonManagementComponent>;
  let salonService: jest.Mocked<SalonService>;

  beforeEach(async () => {
    salonService = {
      saveSalon: jest.fn(),
      getSalons: jest.fn(),
      getSalon: jest.fn(),
      deleteSalon: jest.fn(),
    } as unknown as jest.Mocked<SalonService>;

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
        TranslateModule.forRoot(),
      ],
      declarations: [SalonManagementComponent],
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

    component.salonForm.setValue({
      name: 'Test Salon',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      latitude: '40.7128',
      longitude: '-74.0060',
      services: ['Haircut', 'Coloring'],
      ownerId: 'test-owner-id',
      imageUrl: '',
    });

    component.onSubmit();
    tick();

    expect(component.error).toBe('Failed to save salon.');
    expect(component.loading).toBeFalse();
  }));

  it('should display error if required fields are missing', () => {
    // Set invalid form values
    component.salonForm.setValue({
      name: '',
      address: '',
      city: '',
      zipCode: '',
      latitude: '',
      longitude: '',
      services: [],
      ownerId: '',
      imageUrl: '',
    });

    // Mark all fields as touched to trigger validation
    Object.values(component.salonForm.controls).forEach((control) => {
      control.markAsTouched();
    });

    component.onSubmit();

    expect(component.error).toBe('Please fill in all required fields correctly.');
    expect(salonService.saveSalon).not.toHaveBeenCalled();
  });

  it('should call saveSalon with correct data on valid form submission', fakeAsync(() => {
    const mockResponse = { success: true };
    salonService.saveSalon.mockReturnValue(of(mockResponse));

    // Set form values matching the form control names
    component.salonForm.setValue({
      name: 'Test Salon',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      latitude: '40.7128',
      longitude: '-74.0060',
      services: ['Haircut', 'Coloring'],
      ownerId: 'test-owner-id',
      imageUrl: 'https://example.com/test.jpg',
    });

    component.onSubmit();
    tick();

    // The component transforms the form data to match CreateSalonParams
    // with zipCode -> zip_code, imageUrl -> image_url, and number conversion for lat/lng
    expect(salonService.saveSalon).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Salon',
        address: '123 Test St',
        city: 'Test City',
        zip_code: '12345',
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        services: expect.arrayContaining(['Haircut', 'Coloring']),
        ownerId: 'test-owner-id',
        image_url: 'https://example.com/test.jpg',
      }),
    );

    expect(component.success).toBe('Salon saved successfully!');
    expect(component.loading).toBeFalse();
  }));

  it('should add and remove services correctly', () => {
    // Test adding a service
    const event = { preventDefault: jest.fn() } as unknown as Event;
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

    component.salonForm.setValue({
      name: 'Test Salon',
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      latitude: '40.7128',
      longitude: '-74.0060',
      services: ['Haircut', 'Coloring'],
      ownerId: 'test-owner-id',
      imageUrl: 'https://example.com/test.jpg',
    });

    component.onSubmit();
    tick();

    expect(component.salonForm.value).toEqual({
      name: null,
      address: null,
      city: null,
      zipCode: null,
      latitude: null,
      longitude: null,
      services: [],
      ownerId: 'test-owner-id',
      imageUrl: null,
    });
  }));

  it('should handle geolocation when getting current location', () => {
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
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success) => {
      success(mockPosition as GeolocationPosition);
    });

    component.onUseCurrentLocation();

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(component.salonForm.get('latitude')?.value).toBe(mockPosition.coords.latitude.toString());
    expect(component.salonForm.get('longitude')?.value).toBe(mockPosition.coords.longitude.toString());
  });

  it('should handle geolocation error', () => {
    const mockError = {
      code: 1,
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    // Mock the geolocation API with error
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success, error) => {
      error?.(mockError as GeolocationPositionError);
    });

    component.onUseCurrentLocation();

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(component.error).toBe('Could not get your current location. Please enter it manually.');
  });
});
