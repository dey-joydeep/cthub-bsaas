import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';

export abstract class BaseService {
  protected abstract readonly baseUrl: string;
  protected readonly http = inject(HttpClient);
  protected readonly apiBaseUrl = inject(API_BASE_URL);

  protected getFullUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${this.baseUrl}${endpoint}`;
  }

  protected handleError(error: HttpErrorResponse | Error): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  protected get<T>(url: string): Observable<T> {
    return this.http.get<T>(this.getFullUrl(url)).pipe(catchError((error: HttpErrorResponse | Error) => this.handleError(error)));
  }

  protected post<TResponse, TBody = unknown>(url: string, body: TBody): Observable<TResponse> {
    return this.http
      .post<TResponse>(this.getFullUrl(url), body)
      .pipe(catchError((error: HttpErrorResponse | Error) => this.handleError(error)));
  }

  protected put<TResponse, TBody = unknown>(url: string, body: TBody): Observable<TResponse> {
    return this.http
      .put<TResponse>(this.getFullUrl(url), body)
      .pipe(catchError((error: HttpErrorResponse | Error) => this.handleError(error)));
  }

  protected delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.getFullUrl(url)).pipe(catchError((error: HttpErrorResponse | Error) => this.handleError(error)));
  }
}
