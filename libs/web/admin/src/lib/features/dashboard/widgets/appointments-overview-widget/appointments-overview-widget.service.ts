import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment, AppointmentsFilter, AppointmentsOverview } from './models/appointments-overview-widget.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsOverviewWidgetService {
  private readonly http = inject(HttpClient);

  getAppointmentsOverview(filters: AppointmentsFilter): Observable<AppointmentsOverview> {
    // Replace with actual API call
    return of({} as AppointmentsOverview);
  }

  updateAppointmentStatus(id: string, status: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
