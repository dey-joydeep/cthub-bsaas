import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Salon, Review, Appointment } from './model/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = '/api/salons';
  private readonly http = inject(HttpClient);

  getSalon(id: string): Observable<Salon> {
    return this.http.get<Salon>(`${this.apiUrl}/${id}`).pipe(catchError((err) => this.handleError(err)));
  }

  getSalonReviews(salonId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`/api/salon/${salonId}/reviews`).pipe(catchError((err) => this.handleError(err)));
  }

  isEligibleForReview(userId: string, salonId: string): Observable<{ eligible: boolean }> {
    return this.http
      .get<{ eligible: boolean }>(`/api/user/${userId}/salon/${salonId}/eligible-to-review`, { withCredentials: true })
      .pipe(catchError((err) => this.handleError(err)));
  }

  submitReview(salonId: string, review: { rating: number; comment: string; userId: string }): Observable<Review> {
    return this.http.post<Review>(`/api/salon/${salonId}/reviews`, review).pipe(catchError((err) => this.handleError(err)));
  }

  submitAppointment(appointmentData: Partial<Appointment>): Observable<void> {
    return this.http.post<void>('/api/appointments', appointmentData).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(error: any) {
    let userMessage = 'An unknown error occurred.';
    if (error.status === 0) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      userMessage = error.error?.message || 'Bad request.';
    } else if (error.status === 401) {
      userMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userMessage = 'Requested resource not found.';
    } else if (error.status >= 500) {
      userMessage = 'A server error occurred. Please try again later.';
    }
    return throwError(() => ({ ...error, userMessage }));
  }
}
