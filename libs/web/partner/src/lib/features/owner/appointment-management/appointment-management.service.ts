import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment } from './models/appointment-management.model';

@Injectable({ providedIn: 'root' })
export class AppointmentManagementService {
  public readonly http = inject(HttpClient);

  getAppointments(): Observable<Appointment[]> {
    void this.http;
    // Simulate API call
    return of([
      {
        id: '1',
        date: new Date(),
        clientName: 'John Doe',
        serviceName: 'Haircut',
        staffName: 'Jane Smith',
        status: 'confirmed',
      },
      {
        id: '2',
        date: new Date(),
        clientName: 'Jane Smith',
        serviceName: 'Manicure',
        staffName: 'Mike Johnson',
        status: 'pending',
      },
      {
        id: '3',
        date: new Date(),
        clientName: 'Bob Wilson',
        serviceName: 'Hair Coloring',
        staffName: 'Sarah Davis',
        status: 'completed',
      },
    ]);
  }
}
