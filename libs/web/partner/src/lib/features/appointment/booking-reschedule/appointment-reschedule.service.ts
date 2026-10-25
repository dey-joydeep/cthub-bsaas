import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment, TimeSlot } from './models/appointment-reschedule.model';

@Injectable({ providedIn: 'root' })
export class AppointmentRescheduleService {
  private readonly http = inject(HttpClient);

  getAppointment(id: string): Observable<Appointment> {
    // Replace with actual API call
    return of({} as Appointment);
  }

  getAvailableTimeSlots(params: any): Observable<TimeSlot[]> {
    // Replace with actual API call
    return of([]);
  }

  rescheduleAppointment(id: string, startTime: Date, endTime: Date, notes: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
