import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ResponseEnvelope as ApiEnvelope } from '../salon-owner-settings/models/salon-owner-settings.models';
import {
  Appointment,
  AppointmentDayBoard,
  AppointmentInput,
  AvailableSlotPage,
  RescheduleAppointmentInput,
  WalkInAppointmentInput,
} from './models/appointment-scheduling.models';

@Injectable({ providedIn: 'root' })
export class AppointmentSchedulingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/partner/appointments';

  getDayBoard(branchId: string, date: string): Observable<AppointmentDayBoard> {
    const params = new HttpParams().set('branchId', branchId).set('date', date);
    return this.http.get<ApiEnvelope<AppointmentDayBoard>>(`${this.baseUrl}/day-board`, { params }).pipe(map((response) => response.data));
  }

  findSlots(branchId: string, serviceIds: readonly string[], date: string): Observable<AvailableSlotPage> {
    let params = new HttpParams().set('branchId', branchId).set('date', date);
    serviceIds.forEach((serviceId) => {
      params = params.append('serviceIds', serviceId);
    });
    return this.http.get<ApiEnvelope<AvailableSlotPage>>(`${this.baseUrl}/slots`, { params }).pipe(map((response) => response.data));
  }

  createAppointment(input: AppointmentInput): Observable<Appointment> {
    return this.http.post<ApiEnvelope<Appointment>>(this.baseUrl, input).pipe(map((response) => response.data));
  }

  createWalkInAppointment(input: WalkInAppointmentInput): Observable<Appointment> {
    return this.http.post<ApiEnvelope<Appointment>>(`${this.baseUrl}/walk-ins`, input).pipe(map((response) => response.data));
  }

  getAppointment(appointmentId: string): Observable<Appointment> {
    return this.http.get<ApiEnvelope<Appointment>>(`${this.baseUrl}/${appointmentId}`).pipe(map((response) => response.data));
  }

  rescheduleAppointment(appointmentId: string, input: RescheduleAppointmentInput): Observable<Appointment> {
    return this.http
      .post<ApiEnvelope<Appointment>>(`${this.baseUrl}/${appointmentId}/reschedule`, input)
      .pipe(map((response) => response.data));
  }

  confirmAppointment(appointmentId: string): Observable<Appointment> {
    return this.postAction(appointmentId, 'confirm');
  }

  cancelAppointment(appointmentId: string, reason: string): Observable<Appointment> {
    return this.http
      .post<ApiEnvelope<Appointment>>(`${this.baseUrl}/${appointmentId}/cancel`, { reason })
      .pipe(map((response) => response.data));
  }

  markAppointmentNoShow(appointmentId: string, reason: string): Observable<Appointment> {
    return this.http
      .post<ApiEnvelope<Appointment>>(`${this.baseUrl}/${appointmentId}/no-show`, { reason })
      .pipe(map((response) => response.data));
  }

  markAppointmentArrived(appointmentId: string): Observable<Appointment> {
    return this.postAction(appointmentId, 'arrive');
  }

  startAppointmentService(appointmentId: string): Observable<Appointment> {
    return this.postAction(appointmentId, 'start');
  }

  completeAppointment(appointmentId: string): Observable<Appointment> {
    return this.postAction(appointmentId, 'complete');
  }

  private postAction(appointmentId: string, action: string): Observable<Appointment> {
    return this.http
      .post<ApiEnvelope<Appointment>>(`${this.baseUrl}/${appointmentId}/${action}`, {})
      .pipe(map((response) => response.data));
  }
}
