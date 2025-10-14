import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  constructor(private http: HttpClient) {}

  requestPasswordReset(email: string): Observable<boolean> {
    // Simulate API call
    return of(true);
  }

  resetPassword(token: string, newPassword: string): Observable<boolean> {
    // Simulate API call
    return of(true);
  }
}
