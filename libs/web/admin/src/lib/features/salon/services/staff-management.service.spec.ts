import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StaffManagementService, Staff } from './staff-management.service';

const salonId = 'salon1';
const staffList: Staff[] = [
  { id: 'staff1', name: 'Alice', email: 'alice@example.com', role: 'stylist', approved: true },
  { id: 'staff2', name: 'Bob', email: 'bob@example.com', role: 'colorist', approved: false },
];

describe('StaffManagementService', () => {
  let service: StaffManagementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StaffManagementService],
    });
    service = TestBed.inject(StaffManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch staff list', () => {
    service.getStaff(salonId).subscribe((staff) => {
      expect(staff.length).toBe(2);
      expect(staff[0].name).toBe('Alice');
    });
    const req = httpMock.expectOne(`/api/salons/${salonId}/staff`);
    expect(req.request.method).toBe('GET');
    req.flush(staffList);
  });

  it('should approve staff', () => {
    const staff = { ...staffList[1], approved: true };
    service.approveStaff(salonId, staff.id).subscribe((result) => {
      expect(result.approved).toBeTrue();
    });
    const req = httpMock.expectOne(`/api/salons/${salonId}/staff/${staff.id}/approve`);
    expect(req.request.method).toBe('POST');
    req.flush(staff);
  });

  it('should revoke staff', () => {
    const staff = { ...staffList[0], approved: false };
    service.revokeStaff(salonId, staff.id).subscribe((result) => {
      expect(result.approved).toBeFalse();
    });
    const req = httpMock.expectOne(`/api/salons/${salonId}/staff/${staff.id}/revoke`);
    expect(req.request.method).toBe('POST');
    req.flush(staff);
  });

  it('should add staff', () => {
    const newStaff = { id: 'staff3', name: 'Carol', email: 'carol@example.com', role: 'masseuse', approved: false };
    service.addStaff(salonId, newStaff).subscribe((result) => {
      expect(result.name).toBe('Carol');
    });
    const req = httpMock.expectOne(`/api/salons/${salonId}/staff`);
    expect(req.request.method).toBe('POST');
    req.flush(newStaff);
  });

  it('should remove staff', () => {
    service.removeStaff(salonId, 'staff2').subscribe((result) => {
      expect(result).toBeNull();
    });
    const req = httpMock.expectOne(`/api/salons/${salonId}/staff/staff2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null); // Use null instead of undefined to satisfy type requirements
  });
});
