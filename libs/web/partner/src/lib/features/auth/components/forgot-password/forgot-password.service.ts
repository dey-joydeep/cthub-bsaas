import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);

  requestPasswordReset(email: string): Observable<boolean> {
    return this.http.post<unknown>('/api/auth/password/forgot', { email }).pipe(map(() => true));
  }

  resetPassword(token: string, newPassword: string): Observable<boolean> {
    return this.http.post<unknown>('/api/auth/password/reset', { token, newPassword }).pipe(map(() => true));
  }
}
