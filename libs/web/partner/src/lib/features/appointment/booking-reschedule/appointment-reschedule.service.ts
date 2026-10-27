import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Appointment, TimeSlot } from './models/appointment-reschedule.model';

@Injectable({ providedIn: 'root' })
export class AppointmentRescheduleService {
  getAppointment(_id: string): Observable<Appointment> {
    // Replace with actual API call
    return of({} as Appointment);
  }

  getAvailableTimeSlots(_params: any): Observable<TimeSlot[]> {
    // Replace with actual API call
    return of([]);
  }

  rescheduleAppointment(_id: string, _startTime: Date, _endTime: Date, _notes: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
