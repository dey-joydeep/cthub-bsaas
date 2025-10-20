import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
}

@Injectable({ providedIn: 'root' })
export class StaffManagementService {
  private apiUrl = '/api/salons';

  constructor(private http: HttpClient) {}

  getStaff(salonId: string): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.apiUrl}/${salonId}/staff`);
  }

  approveStaff(salonId: string, staffId: string): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/${salonId}/staff/${staffId}/approve`, {});
  }

  revokeStaff(salonId: string, staffId: string): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/${salonId}/staff/${staffId}/revoke`, {});
  }

  addStaff(salonId: string, staff: Partial<Staff>): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/${salonId}/staff`, staff);
  }

  removeStaff(salonId: string, staffId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${salonId}/staff/${staffId}`);
  }
}
