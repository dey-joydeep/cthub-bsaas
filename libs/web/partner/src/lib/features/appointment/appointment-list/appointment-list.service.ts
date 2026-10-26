import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Appointment } from './models/appointment-list.model';

@Injectable({ providedIn: 'root' })
export class AppointmentListService {
  getAppointments(_params: any): Observable<{ data: Appointment[]; total: number }> {
    // Replace with actual API call
    return of({ data: [], total: 0 });
  }

  cancelAppointment(_id: string, _reason: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
