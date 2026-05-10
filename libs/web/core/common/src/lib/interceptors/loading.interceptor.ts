import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

let totalRequests = 0;

/**
 * HTTP interceptor that shows a loading indicator during HTTP requests
 */
export const loadingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const loadingService = inject(LoadingService);

  // Only show loading for non-GET requests or when explicitly enabled
  if (req.method !== 'GET') {
    totalRequests++;
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (req.method !== 'GET') {
        totalRequests--;
        if (totalRequests === 0) {
          loadingService.hide();
        }
      }
    }),
  );
};
