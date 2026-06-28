import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum SalonStaffRequestType {
  LEAVE = 'LEAVE',
  // Add other request types as needed
}

export enum SalonStaffRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  // Add other statuses as needed
}

export interface CreateLeaveRequestPayload {
  staffId: string;
  leaveFrom: string;
  leaveTo: string;
  reason?: string;
}

export interface StaffRequest {
  id: string;
  staffId: string;
  requestType: SalonStaffRequestType;
  leaveFrom?: string;
  leaveTo?: string;
  reason?: string;
  status: SalonStaffRequestStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class StaffRequestService {
  private baseUrl = '/api/staff-requests';

  constructor(private http: HttpClient) {}

  createLeaveRequest(payload: CreateLeaveRequestPayload): Observable<StaffRequest> {
    return this.http.post<StaffRequest>(`${this.baseUrl}/leave`, payload);
  }

  approveRequest(requestId: string): Observable<StaffRequest> {
    return this.http.post<StaffRequest>(`${this.baseUrl}/approve`, { requestId });
  }

  rejectRequest(requestId: string, rejectionReason: string): Observable<StaffRequest> {
    return this.http.post<StaffRequest>(`${this.baseUrl}/reject`, { requestId, rejectionReason });
  }

  getRequestsForStaff(staffId: string): Observable<StaffRequest[]> {
    return this.http.get<StaffRequest[]>(`${this.baseUrl}/staff/${staffId}`);
  }

  getPendingRequests(): Observable<StaffRequest[]> {
    return this.http.get<StaffRequest[]>(`${this.baseUrl}/pending`);
  }
}
