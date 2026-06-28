import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SalonAppointmentsComponent } from './components/appointments/salon-view/salon-appointments.component';

describe('SalonAppointmentsComponent', () => {
  let component: SalonAppointmentsComponent;
  let fixture: ComponentFixture<SalonAppointmentsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalonAppointmentsComponent, HttpClientTestingModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SalonAppointmentsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should display error if salonId missing', () => {
    component.salonId = undefined;
    component.ngOnInit();
    expect(component.error).toBe('Salon ID is required.');
  });

  it('should display error on failed appointments fetch', fakeAsync(() => {
    component.salonId = 'salon1';
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/salon/salon1/appointments');
    req.flush({ userMessage: 'Failed to load appointments.' }, { status: 500, statusText: 'Server Error' });
    tick();
    expect(component.error).toBe('Failed to load appointments.');
  }));

  it('should fetch appointments successfully', fakeAsync(() => {
    component.salonId = 'salon1';
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/salon/salon1/appointments');
    req.flush([{ id: 1 }]);
    tick();
    expect(component.appointments.length).toBe(1);
    expect(component.error).toBeNull();
  }));
});
