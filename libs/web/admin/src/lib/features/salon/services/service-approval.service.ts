import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalonServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  approved: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServiceApprovalService {
  private apiUrl = '/api/salons';

  constructor(private http: HttpClient) {}

  getServices(salonId: string): Observable<SalonServiceItem[]> {
    return this.http.get<SalonServiceItem[]>(`${this.apiUrl}/${salonId}/services`);
  }

  approveService(salonId: string, serviceId: string): Observable<SalonServiceItem> {
    return this.http.post<SalonServiceItem>(`${this.apiUrl}/${salonId}/services/${serviceId}/approve`, {});
  }

  revokeService(salonId: string, serviceId: string): Observable<SalonServiceItem> {
    return this.http.post<SalonServiceItem>(`${this.apiUrl}/${salonId}/services/${serviceId}/revoke`, {});
  }

  addService(salonId: string, service: Partial<SalonServiceItem>): Observable<SalonServiceItem> {
    return this.http.post<SalonServiceItem>(`${this.apiUrl}/${salonId}/services`, service);
  }

  removeService(salonId: string, serviceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${salonId}/services/${serviceId}`);
  }
}
