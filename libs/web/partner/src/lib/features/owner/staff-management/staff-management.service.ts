import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Staff } from './models/staff-management.model';

@Injectable({ providedIn: 'root' })
export class StaffManagementService {
  constructor(public http: HttpClient) {}

  getStaff(): Observable<Staff[]> {
    void this.http;
    // Simulate API call
    return of([
      {
        id: '1',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'stylist',
        status: 'active',
        lastActive: new Date(),
      },
      {
        id: '2',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        role: 'manicurist',
        status: 'active',
        lastActive: new Date(Date.now() - 86400000), // Yesterday
      },
    ]);
  }

  addStaff(staff: Staff): Observable<Staff> {
    // Simulate API call
    return of({ ...staff, id: 'new-id' });
  }

  updateStaff(staff: Staff): Observable<Staff> {
    // Simulate API call
    return of(staff);
  }
}
