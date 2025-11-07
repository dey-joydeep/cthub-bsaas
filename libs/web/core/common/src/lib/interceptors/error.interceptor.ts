import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable, Provider, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ErrorInterceptor implements HttpInterceptor {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.notificationService.showError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (error.status >= 400 && error.status < 500) {
          if (error.status === 401) {
            this.notificationService.showError('Your session has expired. Please log in again.');
            void this.router.navigate(['/auth/login']);
          } else if (error.status === 403) {
            this.notificationService.showError('You do not have permission to perform this action.');
          } else if (error.status === 404) {
            this.notificationService.showError('The requested resource was not found.');
          } else {
            this.notificationService.showError(this.getErrorMessage(error) ?? 'There was a problem with your request.');
          }
        } else if (error.status >= 500) {
          console.error('Server Error:', {
            url: req.url,
            status: error.status,
            message: this.getErrorMessage(error) ?? 'A server error occurred',
            error: error.error,
          });
          this.notificationService.showError('We encountered an issue processing your request. Our team has been notified.');
        } else {
          console.error('Unexpected Error:', { url: req.url, error });
          this.notificationService.showError('An unexpected error occurred. Please try again later.');
        }

        return throwError(() => error);
      }),
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string | undefined {
    const payload = error.error;

    if (typeof payload === 'object' && payload !== null) {
      const maybeMessage = (payload as Record<string, unknown>).message;
      if (typeof maybeMessage === 'string') {
        return maybeMessage;
      }
    }

    return undefined;
  }
}

export const ERROR_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: ErrorInterceptor,
  multi: true,
};
