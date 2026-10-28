import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
  withXsrfConfiguration,
} from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { ApplicationConfig, ErrorHandler, importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { of } from 'rxjs';

// App imports
import { environment } from '@cthub-bsaas/web-config/environments/partner/environment';
import { AUTH_STATE_PORT, CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core-auth';
import { ERROR_INTERCEPTOR_PROVIDER, ErrorHandlerService, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { PARTNER_API_BASE_URL } from '@cthub-bsaas/web-core-http';
import { ssrInterceptor } from '@cthub-bsaas/web-core-platform';
import {
  AUTH_STATE_SETTER,
  AuthService,
  FORGOT_PASSWORD_API,
  type ForgotPasswordApiPort,
  LOGIN_API,
  LoginApiService,
  REGISTER_API,
  type RegisterApiPort,
} from '@cthub-bsaas/web-partner/auth';
import { routes } from './app.routes';

function createPartnerApiBaseUrl(apiUrl: string): string {
  const normalized = apiUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? `${normalized.slice(0, -4)}/partner` : `${normalized}/partner`;
}

function readCookie(document: Document, name: string): string | null {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const prefix = `${name}=`;
  for (const cookie of cookies) {
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }
  return null;
}

const partnerApiBaseUrl = createPartnerApiBaseUrl(environment.apiUrl);

const partnerApiXsrfInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || req.headers.has('X-XSRF-TOKEN')) {
    return next(req);
  }

  if (!req.url.startsWith(partnerApiBaseUrl)) {
    return next(req);
  }

  const document = inject(DOCUMENT, { optional: true });
  if (!document || typeof document.cookie !== 'string') {
    return next(req);
  }

  const token = readCookie(document, 'XSRF-TOKEN');
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      headers: req.headers.set('X-XSRF-TOKEN', token),
    }),
  );
};

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
      withInterceptors([partnerApiXsrfInterceptor, loadingInterceptor, ssrInterceptor]),
      withFetch(),
    ),
    { provide: PARTNER_API_BASE_URL, useValue: partnerApiBaseUrl },
    ERROR_INTERCEPTOR_PROVIDER,
    provideAnimationsAsync(),
    importProvidersFrom([MatNativeDateModule]),
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: AUTH_STATE_PORT, useExisting: AuthService },
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.initialize();
    }),
    { provide: LOGIN_API, useClass: LoginApiService },
    { provide: AUTH_STATE_SETTER, useExisting: AuthService },
    { provide: CURRENT_USER, useExisting: CurrentUserService },
    {
      provide: FORGOT_PASSWORD_API,
      useFactory: (): ForgotPasswordApiPort => {
        return {
          requestPasswordReset: () => of(true),
          resetPassword: () => of(true),
        };
      },
    },
    {
      provide: REGISTER_API,
      useFactory: (): RegisterApiPort => {
        return {
          register: async () => Promise.resolve(),
        };
      },
    },
  ],
};
