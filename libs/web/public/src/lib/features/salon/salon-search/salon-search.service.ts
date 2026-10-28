import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Salon, SalonServiceItem } from './model/salon-search.model';

@Injectable({ providedIn: 'root' })
export class SalonSearchService {
  private apiUrl = '/api/salons';
  private readonly http = inject(HttpClient);

  searchSalons(params: HttpParams): Observable<{ salons: Salon[]; total: number }> {
    return this.http.get<{ salons: Salon[]; total: number }>(this.apiUrl, { params }).pipe(catchError((err) => this.handleError(err)));
  }

  getServices(): Observable<SalonServiceItem[]> {
    return this.http.get<SalonServiceItem[]>('/api/services').pipe(catchError((err) => this.handleError(err)));
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
