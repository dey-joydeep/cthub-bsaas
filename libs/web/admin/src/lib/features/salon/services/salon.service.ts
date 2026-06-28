import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Salon } from '../models/salon.model';
import { CreateSalonParams, UpdateSalonParams } from '../models/salon-params.model';

@Injectable({ providedIn: 'root' })
export class SalonService {
  private apiUrl = '/api/salons';

  constructor(private http: HttpClient) {}

  getSalons(): Observable<Salon[]> {
    return this.http.get<Salon[]>(this.apiUrl).pipe(catchError((err) => this.handleError(err)));
  }

  getSalon(id: string): Observable<Salon> {
    return this.http.get<Salon>(`${this.apiUrl}/${id}`).pipe(catchError((err) => this.handleError(err)));
  }

  createSalon(salon: CreateSalonParams): Observable<Salon> {
    return this.http.post<Salon>(this.apiUrl, salon).pipe(catchError((err) => this.handleError(err)));
  }

  updateSalon(id: string, salon: UpdateSalonParams): Observable<Salon> {
    return this.http.put<Salon>(`${this.apiUrl}/${id}`, salon).pipe(catchError((err) => this.handleError(err)));
  }

  deleteSalon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError((err) => this.handleError(err)));
  }

  // Fetch top salons, optionally with geolocation
  getTopSalons(latitude?: number, longitude?: number) {
    let params = {};
    if (latitude !== undefined && longitude !== undefined) {
      params = { lat: latitude, lng: longitude };
    }
    return this.http.get<any[]>('/api/salons/top', { params }).pipe(catchError((err) => this.handleError(err)));
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
