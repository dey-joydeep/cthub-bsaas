import {
  HttpClient,
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
import { ApplicationConfig, ErrorHandler, importProvidersFrom, inject } from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { of } from 'rxjs';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// App imports
import { AUTH_STATE_PORT, CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core-auth';
import { ERROR_INTERCEPTOR_PROVIDER, ErrorHandlerService, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { PARTNER_API_BASE_URL } from '@cthub-bsaas/web-core-http';
import { ssrInterceptor, ssrTranslateInterceptor } from '@cthub-bsaas/web-core-platform';
import { environment } from '@cthub-bsaas/web-config/environments/partner/environment';
import { routes } from './app.routes';
import { LOGIN_API, AUTH_STATE_SETTER } from '@cthub-bsaas/web-partner/auth';
import { LoginApiService } from '@cthub-bsaas/web-partner/auth';
import {
  FORGOT_PASSWORD_API,
  REGISTER_API,
  type ForgotPasswordApiPort,
  type RegisterApiPort,
} from '@cthub-bsaas/web-partner/auth';
import { AuthService } from '@cthub-bsaas/web-partner/auth';

// AoT requires an exported function for factories
export function httpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

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
    // PLATFORM_UTILS_TOKEN is provided in web-config at root; no extra providers needed here.

    // Configure TranslateModule for client-side
    {
      provide: TranslateLoader,
      useFactory: httpLoaderFactory,
      deps: [HttpClient],
    },
    TranslateStore,

    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptors([partnerApiXsrfInterceptor, loadingInterceptor, ssrInterceptor, ssrTranslateInterceptor]),
      withFetch(),
    ),
    { provide: PARTNER_API_BASE_URL, useValue: partnerApiBaseUrl },
    // Register global HTTP interceptors
    ERROR_INTERCEPTOR_PROVIDER,
    importProvidersFrom([
      BrowserAnimationsModule,
      MatButtonModule,
      MatCardModule,
      MatCheckboxModule,
      MatChipsModule,
      MatDatepickerModule,
      MatDialogModule,
      MatDividerModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatMenuModule,
      MatPaginatorModule,
      MatProgressSpinnerModule,
      MatRadioModule,
      MatSelectModule,
      MatSidenavModule,
      MatSlideToggleModule,
      MatSnackBarModule,
      MatSortModule,
      MatTableModule,
      MatTabsModule,
      MatToolbarModule,
      MatTooltipModule,
      MatNativeDateModule,
      // Setup the TranslateModule for the application
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ]),
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
        } as ForgotPasswordApiPort;
      },
      deps: [HttpClient],
    },
    {
      provide: REGISTER_API,
      useFactory: (): RegisterApiPort => {
        // TODO: Replace with real registration API integration
        return {
          register: async () => Promise.resolve(),
        } as RegisterApiPort;
      },
    },
  ],
};
