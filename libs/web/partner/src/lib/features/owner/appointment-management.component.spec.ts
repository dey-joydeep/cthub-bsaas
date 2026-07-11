import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AppointmentManagementComponent } from './appointment-management.component';
import { AppointmentService } from './appointment.service';

describe('AppointmentManagementComponent', () => {
  let component: AppointmentManagementComponent;
  let fixture: ComponentFixture<AppointmentManagementComponent>;
  let appointmentService: vi.Mocked<AppointmentService>;

  beforeEach(async () => {
    const appointmentServiceMock = {
      createAppointment: vi.fn(),
      getAppointments: vi.fn(),
      updateAppointmentStatus: vi.fn(),
    };

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
        AppointmentManagementComponent,
      ],
      providers: [{ provide: AppointmentService, useValue: appointmentServiceMock }],
    }).compileComponents();

    appointmentService = TestBed.inject(AppointmentService) as vi.Mocked<AppointmentService>;

    fixture = TestBed.createComponent(AppointmentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.appointmentForm).toBeDefined();
    expect(component.appointmentForm.get('notes')?.value).toBe('');
  });

  it('should mark form as invalid when empty', () => {
    expect(component.appointmentForm.valid).toBeFalsy();
  });

  it('should validate required fields', () => {
    const form = component.appointmentForm;
    form.setValue({
      customerId: 'customer-123',
      serviceId: 's1',
      staffId: 'staff-789',
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:30:00.000Z',
      notes: '',
    });

    expect(form.valid).toBeTruthy();
  });

  it('should call createAppointment when form is valid', () => {
    const mockResponse = { success: true };
    appointmentService.createAppointment.mockReturnValue(of(mockResponse));

    component.appointmentForm.setValue({
      customerId: 'customer-123',
      serviceId: 's1',
      staffId: 'staff-789',
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:30:00.000Z',
      notes: 'Test appointment',
    });

    component.onSubmit();

    expect(appointmentService.createAppointment).toHaveBeenCalledWith({
      customerId: 'customer-123',
      serviceId: 's1',
      staffId: 'staff-789',
      salonId: expect.any(String),
      startTime: expect.any(String),
      endTime: expect.any(String),
      notes: 'Test appointment',
    });

    expect(component.loading).toBeFalsy();
    expect(component.success).toBe('Appointment created successfully!');
  });

  it('should handle error when createAppointment fails', () => {
    const errorResponse = { message: 'Error creating appointment' };
    appointmentService.createAppointment.mockReturnValue(
      throwError(() => ({
        error: errorResponse,
      })),
    );

    component.appointmentForm.setValue({
      customerId: 'customer-123',
      serviceId: 's1',
      staffId: 'staff-789',
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:30:00.000Z',
      notes: '',
    });

    component.onSubmit();

    expect(appointmentService.createAppointment).toHaveBeenCalled();
    expect(component.loading).toBeFalsy();
    expect(component.error).toBe('Error creating appointment');
  });

  it('should not submit form when invalid', () => {
    const form = component.appointmentForm;
    form.patchValue({
      customerId: '',
    });

    component.onSubmit();
    expect(appointmentService.createAppointment).not.toHaveBeenCalled();
  });
});
