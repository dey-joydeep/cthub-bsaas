import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment } from './model/appointment-list.model';

@Injectable({ providedIn: 'root' })
export class AppointmentListService {
  constructor(public http: HttpClient) {}

  getAppointments(params: any): Observable<{ data: Appointment[]; total: number }> {
    void this.http;
    void params;
    // Replace with actual API call
    return of({ data: [], total: 0 });
  }

  cancelAppointment(id: string, reason: string): Observable<void> {
    void id;
    void reason;
    // Replace with actual API call
    return of(undefined);
  }
}
