import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXhr,
} from '@angular/common/http';
import { ApplicationConfig, EnvironmentProviders, isDevMode, mergeApplicationConfig, PLATFORM_ID, Provider } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideServerRendering, ɵSERVER_CONTEXT as SERVER_CONTEXT } from '@angular/platform-server';
import { ErrorService, loadingInterceptor } from '@cthub-bsaas/web-core-common';
import { ssrInterceptor } from '@cthub-bsaas/web-core-platform';
import { appConfig } from './app.config';

// Server-side interceptors
const serverInterceptors: HttpInterceptorFn[] = [ssrInterceptor, loadingInterceptor];

// Mock browser APIs for SSR
const mockWindow = {
  document: {
    body: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  navigator: {
    language: 'en-US',
    languages: ['en-US'],
  },
};

// (removed unused serverTranslateLoader)

// Server-side providers
const serverProviders: (Provider | EnvironmentProviders)[] = [
  // Core server providers
  provideServerRendering(),
  {
    provide: 'ENABLE_DETAILED_ERRORS',
    useValue: isDevMode(),
  },

  // Platform utilities provided in root by token factory (no manual factory needed)
  // StorageService is SSR-safe and provided in root

  // Error handling with SSR support
  {
    provide: ErrorService,
    useFactory: () => {
      console.log('🔧 Initializing ErrorService for SSR');
      return new ErrorService();
    },
  },
  // Server-specific configurations
  { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
  { provide: 'SSR', useValue: true },
  { provide: 'BROWSER', useValue: false },

  // HTTP client configuration with server interceptors
  provideHttpClient(
    withInterceptors([
      ...serverInterceptors,
      // Add any additional interceptors here
    ]),
    withFetch(),
  ),
  { provide: 'WINDOW', useValue: mockWindow },
  { provide: 'DOCUMENT', useValue: mockWindow.document },
  { provide: 'LOCAL_STORAGE', useValue: mockWindow.localStorage },
  { provide: 'SESSION_STORAGE', useValue: mockWindow.sessionStorage },
  { provide: 'REQUEST', useValue: null },
  { provide: 'RESPONSE', useValue: null },
  { provide: 'Dd', useValue: null },
  { provide: PLATFORM_ID, useValue: 'server' },
  { provide: SERVER_CONTEXT, useValue: 'ssr' },
  { provide: MAT_DATE_LOCALE, useValue: 'en-US' },

  provideHttpClient(
    withXhr(),
    withInterceptors([ssrInterceptor, loadingInterceptor, (req: HttpRequest<unknown>, next: HttpHandlerFn) => next(req)]),
  ),

  { provide: 'SSR', useValue: true },
  { provide: 'BROWSER', useValue: false },
];

// Combine with base app config
export const config: ApplicationConfig = mergeApplicationConfig(appConfig, {
  providers: serverProviders,
});
