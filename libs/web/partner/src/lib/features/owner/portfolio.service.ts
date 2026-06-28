import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreatePortfolioParams } from '../../models/portfolio-params.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private apiUrl = '/api/portfolio';

  constructor(private http: HttpClient) {}

  savePortfolio(data: CreatePortfolioParams | FormData): Observable<{ success: boolean }> {
    let payload: any;
    if (data instanceof FormData) {
      payload = data;
    } else {
      payload = {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        salonId: data.salonId,
        createdBy: data.createdBy,
      };
    }
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/save`, payload).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: any) {
    let userMessage = 'An error occurred.';
    if (err.status === 404) {
      userMessage = 'Portfolio not found.';
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
