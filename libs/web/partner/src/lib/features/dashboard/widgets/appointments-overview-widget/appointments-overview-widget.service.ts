import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppointmentsFilter, AppointmentsOverview } from './models/appointments-overview-widget.model';

@Injectable({ providedIn: 'root' })
export class AppointmentsOverviewWidgetService {
  getAppointmentsOverview(_filters: AppointmentsFilter): Observable<AppointmentsOverview> {
    // Replace with actual API call
    return of({} as AppointmentsOverview);
  }

  updateAppointmentStatus(_id: string, _status: string): Observable<void> {
    // Replace with actual API call
    return of(undefined);
  }
}
