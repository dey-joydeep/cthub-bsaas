import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateAppointmentParams } from '../../models/appointment-params.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private apiUrl = '/api/appointment';

  constructor(private http: HttpClient) {}

  createAppointment(params: CreateAppointmentParams): Observable<any> {
    const payload = {
      customerId: params.customerId,
      salonId: params.salonId,
      serviceId: params.serviceId,
      staffId: params.staffId,
      startTime: params.startTime,
      endTime: params.endTime,
      notes: params.notes,
    };
    return this.http.post(`${this.apiUrl}/appointments`, payload).pipe(catchError((err) => this.handleError(err)));
  }

  saveAppointment(data: CreateAppointmentParams): Observable<{ success: boolean }> {
    const payload = {
      customerId: data.customerId,
      salonId: data.salonId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
    };
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/save`, payload).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: any) {
    let userMessage = 'An error occurred.';
    if (err.status === 404) {
      userMessage = 'Appointment not found.';
    } else if (err.status === 401) {
      userMessage = 'You are not authorized. Please log in again.';
    } else if (err.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (err.status === 400) {
      userMessage = err.error?.error || 'Bad request.';
    } else if (err.error?.error) {
      userMessage = err.error.error;
    }
    return throwError(() => ({ ...err, userMessage }));
  }
}
