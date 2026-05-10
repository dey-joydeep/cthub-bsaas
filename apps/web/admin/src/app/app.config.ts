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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { map } from 'rxjs/operators';
import { TranslateLoader, TranslateModule, TranslateStore } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

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
import { routes } from './app.routes';
import { ErrorHandlerService, ERROR_INTERCEPTOR_PROVIDER, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { ssrInterceptor, ssrTranslateInterceptor } from '@cthub-bsaas/web-core-platform';
import { AUTH_STATE_PORT, CURRENT_USER, CurrentUserService } from '@cthub-bsaas/web-core/auth';
import { LOGIN_API, AUTH_STATE_SETTER, FORGOT_PASSWORD_API, REGISTER_API, type ForgotPasswordApiPort, type RegisterApiPort } from '@cthub-bsaas/web-admin/auth';
import { AuthService } from '@cthub-bsaas/web-admin/auth';
import { AuthApiService } from './core/auth/services/auth-api.service';

// AoT requires an exported function for factories
export function httpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Configure TranslateModule for client-side with SSR support
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
      withInterceptors([loadingInterceptor, ssrInterceptor, ssrTranslateInterceptor]),
      withFetch(),
    ),
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
