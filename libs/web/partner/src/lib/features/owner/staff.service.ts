import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Staff } from '../staff/models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  addStaff(salonId: string, data: FormData): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/salons/${salonId}/staff`, data).pipe(catchError((err) => this.handleError(err)));
  }

  activateStaff(salonId: string, staffId: string): Observable<Staff> {
    return this.http
      .post<Staff>(`${this.apiUrl}/salons/${salonId}/staff/${staffId}/activate`, {})
      .pipe(catchError((err) => this.handleError(err)));
  }

  deactivateStaff(salonId: string, staffId: string): Observable<Staff> {
    return this.http
      .post<Staff>(`${this.apiUrl}/salons/${salonId}/staff/${staffId}/deactivate`, {})
      .pipe(catchError((err) => this.handleError(err)));
  }

  removeStaff(salonId: string, staffId: string): Observable<Staff> {
    return this.http.delete<Staff>(`${this.apiUrl}/salons/${salonId}/staff/${staffId}`).pipe(catchError((err) => this.handleError(err)));
  }

  getStaffList(salonId: string): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.apiUrl}/salons/${salonId}/staff`).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: any) {
    // Standardize error object for the component
    let userMessage = 'An error occurred.';
    if (err.status === 404) {
      userMessage = 'Staff not found.';
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
