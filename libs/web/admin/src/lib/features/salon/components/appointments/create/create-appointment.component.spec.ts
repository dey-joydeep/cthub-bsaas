import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateAppointmentComponent } from './create-appointment.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('AppointmentCreateComponent', () => {
  let component: CreateAppointmentComponent;
  let fixture: ComponentFixture<CreateAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      declarations: [CreateAppointmentComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error if required fields missing', () => {
    component.appointmentForm.setValue({
      salonId: '',
      serviceId: '',
      staffId: '',
      startTime: '',
      endTime: '',
      notes: '',
    });
    component.submit();
    expect(component.error).toBe('Salon, service, and time are required.');
  });

  it('should display error on failed appointment create', fakeAsync(() => {
    spyOn(component['http'], 'post').and.returnValue(throwError(() => ({ error: { userMessage: 'Failed to create appointment.' } })));
    component.appointmentForm.setValue({
      salonId: 'salon1',
      serviceId: 'svc1',
      staffId: 'staff1',
      startTime: '2023-01-01T10:00:00',
      endTime: '2023-01-01T11:00:00',
      notes: '',
    });
    component['userId'] = 'user1';
    component.submit();
    tick();
    expect(component.error).toBe('Failed to create appointment.');
  }));

  it('should create appointment successfully', fakeAsync(() => {
    const mockResponse = { id: 'apt1' };
    spyOn(component['http'], 'post').and.returnValue(of(mockResponse));
    spyOn(component['router'], 'navigate');

    component.appointmentForm.setValue({
      salonId: 'salon1',
      serviceId: 'svc1',
      staffId: 'staff1',
      startTime: '2023-01-01T10:00:00',
      endTime: '2023-01-01T11:00:00',
      notes: '',
    });
    component['userId'] = 'user1';
    component.submit();
    tick();
    expect(component['router'].navigate).toHaveBeenCalledWith(['/user/appointments']);
    expect(component.success).toBe('Appointment created!');
  }));
});
