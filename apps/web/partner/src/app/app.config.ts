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
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PreloadAllModules, provideRouter, withPreloading, withComponentInputBinding } from '@angular/router';
import { of } from 'rxjs';

// App imports
import { AUTH_STATE_PORT, CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core-auth';
import { ERROR_INTERCEPTOR_PROVIDER, ErrorHandlerService, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { ssrInterceptor } from '@cthub-bsaas/web-core-platform';
import { routes } from './app.routes';
import { LOGIN_API, AUTH_STATE_SETTER } from '@cthub-bsaas/web-partner/auth';
import { LoginApiService } from '@cthub-bsaas/web-partner/auth';
import { FORGOT_PASSWORD_API, REGISTER_API, type ForgotPasswordApiPort, type RegisterApiPort } from '@cthub-bsaas/web-partner/auth';
import { AuthService } from '@cthub-bsaas/web-partner/auth';

// AoT requires an exported function for factories

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    // PLATFORM_UTILS_TOKEN is provided in web-config at root; no extra providers needed here.

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
            return of(true);
          },
          resetPassword: () => {
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
