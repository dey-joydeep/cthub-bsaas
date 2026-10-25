import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment } from './models/appointment-list.model';

@Injectable({ providedIn: 'root' })
export class AppointmentListService {
  private readonly http = inject(HttpClient);

  getAppointments(params: any): Observable<{ data: Appointment[]; total: number }> {
    // Replace with actual API call
    return of({ data: [], total: 0 });
  }

  cancelAppointment(id: string, reason: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
