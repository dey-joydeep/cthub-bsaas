import {
  HttpClient,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
  withXsrfConfiguration,
} from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withPreloading, PreloadAllModules, withComponentInputBinding } from '@angular/router';
import { of } from 'rxjs';

// App imports
import { routes } from './app.routes';
import { LOGIN_API, AUTH_STATE_SETTER } from '@cthub-bsaas/web-customer/auth';
import { LoginApiService } from '@cthub-bsaas/web-customer/auth';
import { FORGOT_PASSWORD_API, REGISTER_API, type ForgotPasswordApiPort, type RegisterApiPort } from '@cthub-bsaas/web-customer/auth';
import { ErrorHandlerService, ERROR_INTERCEPTOR_PROVIDER, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { ssrInterceptor } from '@cthub-bsaas/web-core-platform';
import { AUTH_STATE_PORT, CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core-auth';
import { AuthService } from '@cthub-bsaas/web-customer/auth';

// AoT requires an exported function for factories

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptors([loadingInterceptor, ssrInterceptor]),
      withFetch(),
    ),
    // Register global HTTP interceptors
    ERROR_INTERCEPTOR_PROVIDER,
    provideAnimationsAsync(),
    importProvidersFrom([MatNativeDateModule]),
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: AUTH_STATE_PORT, useExisting: AuthService },
    { provide: LOGIN_API, useClass: LoginApiService },
    { provide: AUTH_STATE_SETTER, useExisting: AuthService },
    { provide: CURRENT_USER, useExisting: CurrentUserService },
    // Token-based auth APIs (temporary placeholder implementations)
    {
      provide: FORGOT_PASSWORD_API,
      useFactory: (): ForgotPasswordApiPort => {
        // TODO: Replace with real API integration using a dedicated AuthApiService
        return {
          requestPasswordReset: () => {
            // return http.post<ApiResponse<any>>('/api/auth/password/forgot', { email }).pipe(map(r => !!r.success));
            return of(true);
          },
          resetPassword: () => {
            // return http.post<ApiResponse<any>>('/api/auth/password/reset', { token, newPassword }).pipe(map(r => !!r.success));
            return of(true);
          },
        };
      },
      deps: [HttpClient],
    },
    {
      provide: REGISTER_API,
      useFactory: (): RegisterApiPort => {
        // TODO: Replace with real registration API integration
        return {
          register: async () => Promise.resolve(),
        };
      },
    },
  ],
};
