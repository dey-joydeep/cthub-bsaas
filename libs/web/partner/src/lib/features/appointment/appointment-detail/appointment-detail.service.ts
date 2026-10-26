import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppointmentWithDetails } from './models/appointment-detail.model';

@Injectable({ providedIn: 'root' })
export class AppointmentDetailService {
  getAppointment(_id: string): Observable<AppointmentWithDetails> {
    // Replace with actual API call
    return of({} as AppointmentWithDetails);
  }

  cancelAppointment(_id: string, _reason: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
