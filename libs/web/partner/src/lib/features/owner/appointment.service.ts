import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateAppointmentParams } from '../../models/appointment-params.model';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private apiUrl = '/api/appointments';

  constructor(private http: HttpClient) {}

  /**
   * Create a new appointment
   * @param appointmentData The appointment data to create
   */
  createAppointment(appointmentData: CreateAppointmentParams): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, appointmentData).pipe(catchError(this.handleError));
  }

  /**
   * Get appointment by ID
   * @param id The appointment ID
   */
  getAppointment(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Update an existing appointment
   * @param id The appointment ID
   * @param updateData The data to update
   */
  updateAppointment(id: string, updateData: Partial<CreateAppointmentParams>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, updateData).pipe(catchError(this.handleError));
  }

  /**
   * Delete an appointment
   * @param id The appointment ID to delete
   */
  deleteAppointment(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Get all appointments with optional filtering
   * @param params Optional query parameters for filtering
   */
  getAppointments(params?: {
    customerId?: string;
    staffId?: string;
    serviceId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl, { params: params as any }).pipe(catchError(this.handleError));
  }

  /**
   * Handle API errors
   */
  private handleError(error: any) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.statusText || 'Server error';

      // Add more specific error messages based on status code
      if (error.status === 401) {
        errorMessage = 'You are not authorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.status >= 500) {
        errorMessage = 'A server error occurred. Please try again later.';
      }
    }

    console.error('API Error:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error,
    }));
  }
}
