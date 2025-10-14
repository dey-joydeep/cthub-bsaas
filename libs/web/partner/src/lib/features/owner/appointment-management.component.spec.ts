import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AppointmentManagementComponent } from './appointment-management.component';
import { AppointmentService } from './appointment.service';

import { AppointmentStatus } from '../../../../../../libs/frontend/src/app/shared/enums/appointment-status.enum';

describe('AppointmentManagementComponent', () => {
  let component: AppointmentManagementComponent;
  let fixture: ComponentFixture<AppointmentManagementComponent>;
  let appointmentService: jest.Mocked<AppointmentService>;

  beforeEach(async () => {
    const appointmentServiceMock = {
      createAppointment: jest.fn(),
      getAppointments: jest.fn(),
      updateAppointmentStatus: jest.fn(),
    } as unknown as jest.Mocked<AppointmentService>;

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule,
        MatIconModule,
        MatSelectModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      declarations: [AppointmentManagementComponent],
      providers: [{ provide: AppointmentService, useValue: appointmentServiceMock }, TranslateService],
    }).compileComponents();

    appointmentService = TestBed.inject(AppointmentService) as jest.Mocked<AppointmentService>;

    fixture = TestBed.createComponent(AppointmentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.appointmentForm).toBeDefined();
    expect(component.appointmentForm.get('status')?.value).toBe(AppointmentStatus.PENDING);
    expect(component.appointmentForm.get('notes')?.value).toBe('');
  });

  it('should mark form as invalid when empty', () => {
    expect(component.appointmentForm.valid).toBeFalsy();
  });

  it('should validate required fields', () => {
    const form = component.appointmentForm;
    const customerId = form.get('customerId');
    const serviceId = form.get('serviceId');
    const staffId = form.get('staffId');
    const startTime = form.get('startTime');
    const endTime = form.get('endTime');

    // Initially all required fields are invalid
    expect(customerId?.valid).toBeFalsy();
    expect(serviceId?.valid).toBeFalsy();
    expect(staffId?.valid).toBeFalsy();
    expect(startTime?.valid).toBeFalsy();
    expect(endTime?.valid).toBeFalsy();

    // Set values for required fields
    customerId?.setValue('customer-123');
    serviceId?.setValue('service-456');
    staffId?.setValue('staff-789');
    startTime?.setValue('2023-01-01T10:00');
    endTime?.setValue('2023-01-01T11:00');

    expect(form.valid).toBeTruthy();
  });

  it('should call createAppointment when form is valid', () => {
    // Arrange
    const mockResponse = { success: true };
    appointmentService.createAppointment.mockReturnValue(of(mockResponse));
    appointmentService.getAppointments.mockReturnValue(
      of({
        success: true,
        data: [{ id: '1', date: '2023-01-01', time: '10:00', clientName: 'John Doe', service: 'Haircut' }],
        message: 'Appointments retrieved successfully',
      }),
    );

    const form = component.appointmentForm;
    form.patchValue({
      customerId: 'customer-123',
      serviceId: 'service-456',
      staffId: 'staff-789',
      startTime: '2023-01-01T10:00',
      endTime: '2023-01-01T11:00',
      status: AppointmentStatus.CONFIRMED,
      notes: 'Test appointment',
    });

    // Act
    component.onSubmit();

    // Assert
    expect(appointmentService.createAppointment).toHaveBeenCalledWith({
      customerId: 'customer-123',
      serviceId: 'service-456',
      staffId: 'staff-789',
      salonId: jasmine.any(String), // Add required salonId field
      startTime: jasmine.any(String),
      endTime: jasmine.any(String),
      notes: 'Test appointment',
    });

    expect(component.loading).toBeFalsy();
    expect(component.success).toBe('Appointment created successfully!');
  });

  it('should handle error when createAppointment fails', () => {
    // Arrange
    const errorResponse = { message: 'Error creating appointment' };
    appointmentService.createAppointment.mockReturnValue(
      throwError(() => ({
        error: errorResponse,
      })),
    );

    const form = component.appointmentForm;
    form.patchValue({
      customerId: 'customer-123',
      serviceId: 'service-456',
      staffId: 'staff-789',
      startTime: '2023-01-01T10:00',
      endTime: '2023-01-01T11:00',
    });

    // Act
    component.onSubmit();

    // Assert
    expect(appointmentService.createAppointment).toHaveBeenCalled();
    expect(component.loading).toBeFalsy();
    expect(component.error).toBe('Error creating appointment');
  });

  it('should not submit form when invalid', () => {
    // Arrange
    spyOn(component, 'onSubmit').and.callThrough();
    const form = component.appointmentForm;
    form.patchValue({
      customerId: '', // Invalid: required field is empty
    });

    // Act
    component.onSubmit();

    // Assert
    expect(appointmentService.createAppointment).not.toHaveBeenCalled();
  });

  it('should have all appointment statuses in the statuses array', () => {
    expect(component.statuses).toEqual(Object.values(AppointmentStatus));
  });
});
