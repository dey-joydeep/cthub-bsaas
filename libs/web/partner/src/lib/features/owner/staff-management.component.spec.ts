import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StaffManagementComponent } from './staff-management.component';
import { StaffService } from './staff.service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { Staff } from '../staff/models/staff.model';

describe('StaffManagementComponent', () => {
  let component: StaffManagementComponent;
  let fixture: ComponentFixture<StaffManagementComponent>;
  let staffService: jest.Mocked<StaffService>;

  beforeEach(async () => {
    staffService = {
      addStaff: jest.fn(),
      getStaffList: jest.fn(),
    } as unknown as jest.Mocked<StaffService>;

    // Provide the mock service
    TestBed.overrideProvider(StaffService, { useValue: staffService });
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [StaffManagementComponent],
      providers: [
        { provide: StaffService, useValue: staffService },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StaffManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on failed staff add', fakeAsync(() => {
    staffService.addStaff.mockReturnValue(throwError(() => ({ userMessage: 'Failed to add staff.' })));
    staffService.getStaffList.mockReturnValue(
      of([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'stylist', approved: true, isActive: true, contact: '1234567890' },
      ]),
    );
    component.staffForm.setValue({ name: 'Test', email: 'test@test.com', contact: '123', nickname: '', profilePicture: null });
    component.salonId = 'salon1';
    component.onSubmit();
    tick();
    expect(component.error).toBe('Failed to add staff.');
  }));

  it('should display error if required fields missing', () => {
    component.staffForm.setValue({ name: '', email: '', contact: '', nickname: '', profilePicture: null });
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
  });

  it('should call addStaff on valid submit', fakeAsync(() => {
    const mockStaff: Staff = {
      id: '1',
      name: 'Test',
      email: 'test@test.com',
      contact: '123',
      role: 'stylist',
      approved: true,
      isActive: true,
    };
    staffService.addStaff.mockReturnValue(of(mockStaff));
    component.staffForm.setValue({ name: 'Test', email: 'test@test.com', contact: '123', nickname: '', profilePicture: null });
    component.salonId = 'salon1';
    component.onSubmit();
    tick();
    expect(staffService.addStaff).toHaveBeenCalled();
    expect(component.staffList).toContain(mockStaff);
  }));
});
