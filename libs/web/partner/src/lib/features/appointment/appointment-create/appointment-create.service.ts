import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Service, Staff } from './models/appointment-create.model';

@Injectable({ providedIn: 'root' })
export class AppointmentCreateService {
  private readonly http = inject(HttpClient);

  getServices(): Observable<Service[]> {
    // Replace with actual API call
    return of([
      { id: 'haircut', name: 'Haircut', duration: 30, price: 30 },
      { id: 'hair-color', name: 'Hair Color', duration: 120, price: 80 },
      { id: 'manicure', name: 'Manicure', duration: 45, price: 25 },
      { id: 'pedicure', name: 'Pedicure', duration: 60, price: 35 },
      { id: 'facial', name: 'Facial', duration: 60, price: 50 },
    ]);
  }

  getStaff(): Observable<Staff[]> {
    // Replace with actual API call
    return of([
      { id: 'staff-1', name: 'Alex Johnson', services: ['haircut', 'hair-color'] },
      { id: 'staff-2', name: 'Maria Garcia', services: ['manicure', 'pedicure'] },
      { id: 'staff-3', name: 'James Smith', services: ['facial', 'haircut'] },
    ]);
  }

  createAppointment(appointment: any): Observable<any> {
    // Replace with actual API call
    return of({ success: true });
  }
}
