import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Appointment, TimeSlot } from '../appointment-list/model/appointment-list.model';

export interface TimeSlotParams {
  serviceId: string;
  staffId: string;
  date: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class AppointmentRescheduleService {
  getAppointment(_id: string): Observable<Appointment> {
    return of({} as Appointment);
  }

  getAvailableTimeSlots(_params: TimeSlotParams): Observable<TimeSlot[]> {
    return of([]);
  }

  rescheduleAppointment(_id: string, _startTime: Date, _endTime: Date, _notes: string): Observable<void> {
    return of(undefined);
  }
}
