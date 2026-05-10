import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { UpdateUserProfileParams } from './models/user-params.model';
import { catchError } from 'rxjs/operators';

export interface UserStats {
  businessCount: number;
  customerCount: number;
  activeBusiness: number;
  activeCustomer: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = '/api/user/stats';

  constructor(private http: HttpClient) {}

  getUserStats(tenantId: string): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/stats?tenant_id=${tenantId}`).pipe(catchError((err) => this.handleError(err)));
  }

  // Update user profile (customer/staff/owner)
  updateProfile(data: UpdateUserProfileParams | FormData): Observable<{ success: boolean }> {
    // If FormData is required for file uploads, keep support for it, otherwise prefer the typed object
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/update-profile`, data).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(error: HttpErrorResponse) {
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
