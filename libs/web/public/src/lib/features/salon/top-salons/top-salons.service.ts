import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Salon } from './model/top-salons.model';

@Injectable({ providedIn: 'root' })
export class TopSalonsService {
  private apiUrl = '/api/salons';

  constructor(private http: HttpClient) {}

  // Fetch top salons, optionally with geolocation
  getTopSalons(latitude?: number, longitude?: number) {
    let params = {};
    if (latitude !== undefined && longitude !== undefined) {
      params = { lat: latitude, lng: longitude };
    }
    return this.http.get<Salon[]>('/api/salons/top', { params }).pipe(catchError((err) => this.handleError(err)));
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
