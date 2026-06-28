import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateSalonParams, UpdateSalonParams } from '../../models/salon-params.model';

@Injectable({ providedIn: 'root' })
export class SalonService {
  private apiUrl = '/api/salon';

  constructor(private http: HttpClient) {}

  saveSalon(data: CreateSalonParams): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/save`, data).pipe(catchError((err) => this.handleError(err)));
  }

  updateSalon(params: UpdateSalonParams): Observable<any> {
    // Ensure we're using the correct interface by spreading the params
    // and explicitly including required fields with proper types
    const payload: Partial<CreateSalonParams> & { id: string; updatedBy: string } = {
      ...params,
      updatedBy: 'current-user-id', // This should be replaced with actual user ID from auth service
    };

    return this.http.put(`${this.apiUrl}/salons/${params.id}`, payload).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: any) {
    let userMessage = 'An error occurred.';
    if (err.status === 404) {
      userMessage = 'Salon not found.';
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
