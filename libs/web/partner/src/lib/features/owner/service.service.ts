import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateServiceParams } from '../../models/service-params.model';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private apiUrl = '/api/service';

  constructor(private http: HttpClient) {}

  saveService(data: CreateServiceParams): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/save`, data).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: any) {
    let userMessage = 'An error occurred.';
    if (err.status === 404) {
      userMessage = 'Service not found.';
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
