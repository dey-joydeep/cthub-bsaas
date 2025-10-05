import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AppointmentWithDetails } from './model/appointment-detail.model';

@Injectable({ providedIn: 'root' })
export class AppointmentDetailService {
  constructor(private http: HttpClient) {}

  getAppointment(id: string): Observable<AppointmentWithDetails> {
    // Replace with actual API call
    return of({} as AppointmentWithDetails);
  }

  cancelAppointment(id: string, reason: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
