import {
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
import { map } from 'rxjs/operators';


// App imports
import { routes } from './app.routes';
import { ErrorHandlerService, ERROR_INTERCEPTOR_PROVIDER, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { ssrInterceptor } from '@cthub-bsaas/web-core-platform';
import { AUTH_STATE_PORT, CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core/auth';
import {
  LOGIN_API,
  AUTH_STATE_SETTER,
  FORGOT_PASSWORD_API,
  REGISTER_API,
  type ForgotPasswordApiPort,
  type RegisterApiPort,
} from '@cthub-bsaas/web-admin/auth';
import { AuthService } from '@cthub-bsaas/web-admin/auth';
import { AuthApiService } from './core/auth/services/auth-api.service';

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
    importProvidersFrom([
      MatNativeDateModule,
    ]),
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: AUTH_STATE_PORT, useExisting: AuthService },
    { provide: CURRENT_USER, useExisting: CurrentUserService },
    { provide: LOGIN_API, useExisting: AuthApiService },
    { provide: AUTH_STATE_SETTER, useExisting: AuthService },
    // Bridge library tokens to app services
    {
      provide: FORGOT_PASSWORD_API,
      useFactory: (api: AuthApiService): ForgotPasswordApiPort => ({
        requestPasswordReset: (email: string) => api.requestPasswordReset(email).pipe(map((r) => !!r?.success)),
        resetPassword: (token: string, newPassword: string) => api.resetPassword(token, newPassword).pipe(map((r) => !!r?.success)),
      }),
      deps: [AuthApiService],
    },
    {
      provide: REGISTER_API,
      useFactory: (): RegisterApiPort => ({
        // TODO: Replace with real registration API when available
        register: async () => Promise.resolve(),
      }),
      deps: [],
    },
  ],
};
