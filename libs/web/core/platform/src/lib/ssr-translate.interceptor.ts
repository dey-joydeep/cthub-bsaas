import { HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export function ssrTranslateInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  // Skip translation requests on the server
  if (req.url.includes('/assets/i18n/')) {
    // Just pass through for now - the server will handle the translation files
    return next(req);
  }
  return next(req);
}
