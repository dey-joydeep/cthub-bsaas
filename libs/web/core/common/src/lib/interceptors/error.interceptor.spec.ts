import { Injector, runInInjectionContext } from '@angular/core';
import { HttpContext, HttpErrorResponse, type HttpHandler, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { BYPASS_ERROR_INTERCEPTOR, ErrorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let notificationServiceMock: { showError: jest.Mock };
  let routerMock: { navigate: jest.Mock };

  beforeEach(() => {
    notificationServiceMock = { showError: jest.fn() };
    routerMock = { navigate: jest.fn().mockResolvedValue(true) };

    const injector = Injector.create({
      providers: [
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    interceptor = runInInjectionContext(injector, () => new ErrorInterceptor());
  });

  it('shows error notification and navigates to /auth/login on standard 401 response', async () => {
    const req = new HttpRequest('GET', '/api/test');
    const handler: HttpHandler = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } })),
    };

    await expect(firstValueFrom(interceptor.intercept(req, handler))).rejects.toMatchObject({
      status: 401,
    });

    expect(notificationServiceMock.showError).toHaveBeenCalledWith('Your session has expired. Please log in again.');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('bypasses global 401 error handling when BYPASS_ERROR_INTERCEPTOR context token is set', async () => {
    const context = new HttpContext().set(BYPASS_ERROR_INTERCEPTOR, true);
    const req = new HttpRequest('GET', '/api/auth/me', { context });
    const handler: HttpHandler = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } })),
    };

    await expect(firstValueFrom(interceptor.intercept(req, handler))).rejects.toMatchObject({
      status: 401,
    });

    expect(notificationServiceMock.showError).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('bypasses global error handling when x-silent-auth header is present', async () => {
    const req = new HttpRequest('GET', '/api/auth/me', {
      headers: new HttpHeaders({ 'x-silent-auth': 'true' }),
    });
    const handler: HttpHandler = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Unauthorized' } })),
    };

    await expect(firstValueFrom(interceptor.intercept(req, handler))).rejects.toMatchObject({
      status: 401,
    });

    expect(notificationServiceMock.showError).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
