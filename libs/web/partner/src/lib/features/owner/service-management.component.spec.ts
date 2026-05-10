import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ServiceManagementComponent } from './service-management.component';
import { ServiceService } from './service.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('ServiceManagementComponent', () => {
  let component: ServiceManagementComponent;
  let fixture: ComponentFixture<ServiceManagementComponent>;
  let serviceService: jest.Mocked<ServiceService>;

  beforeEach(async () => {
    serviceService = {
      saveService: jest.fn(),
      getServices: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
    } as unknown as jest.Mocked<ServiceService>;

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ServiceManagementComponent],
      providers: [{ provide: ServiceService, useValue: serviceService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ServiceManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed service save', fakeAsync(() => {
    const errorResponse = { error: { userMessage: 'Failed to save service.' } };
    serviceService.saveService.mockReturnValue(throwError(() => errorResponse));

    // Set form values
    component.serviceForm.setValue({
      name: 'Test',
      description: 'Desc',
      duration: '30',
      price: '50',
      salonId: 'test-salon-123',
    });

    // Mock the auth service or set the required properties directly
    Object.defineProperty(component, 'currentUser', {
      get: () => ({ id: 'user-123' }),
      configurable: true,
    });

    component.onSubmit();
    tick();

    expect(serviceService.saveService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test',
        description: 'Desc',
        duration: 30,
        price: 50,
        createdBy: 'user-123',
        salonId: 'test-salon-123',
        isActive: true,
      }),
    );
    expect(component.error).toBe('Failed to save service.');

    // Cleanup
    Object.defineProperty(component, 'currentUser', {
      get: () => undefined,
      configurable: true,
    });
  }));

  it('should display error if required fields missing', () => {
    component.serviceForm.setValue({ name: '', description: '', duration: '', price: '', salonId: '' });
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
  });

  it('should call saveService on valid submit', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: {
        id: '1',
        name: 'Test',
        description: 'Desc',
        duration: 30,
        price: 50,
        isActive: true,
      },
      message: 'Service saved successfully',
    };

    serviceService.saveService.mockReturnValue(of(mockResponse));
    // serviceService.getServices.mockReturnValue(of({
    //   success: true,
    //   data: [
    //     {
    //       id: '1',
    //       name: 'Test',
    //       description: 'Desc',
    //       duration: 30,
    //       price: 50,
    //       isActive: true
    //     }
    //   ],
    //   message: 'Services retrieved successfully'
    // }));

    // Mock the auth service or set the required properties directly
    Object.defineProperty(component, 'currentUser', {
      get: () => ({ id: 'user-123' }),
      configurable: true,
    });

    // Set form values
    component.serviceForm.setValue({
      name: 'Test',
      description: 'Desc',
      duration: '30',
      price: '50',
      salonId: 'test-salon-123',
    });

    component.onSubmit();
    tick();

    expect(serviceService.saveService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test',
        description: 'Desc',
        duration: 30,
        price: 50,
        createdBy: 'user-123',
        salonId: 'test-salon-123',
        isActive: true,
      }),
    );

    // Cleanup
    Object.defineProperty(component, 'currentUser', {
      get: () => undefined,
      configurable: true,
    });
  }));
});
