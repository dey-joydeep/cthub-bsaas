import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';

export interface PlatformUtils {
  readonly isBrowser: boolean;
  readonly isServer: boolean;
  readonly windowRef: Window | null;
  readonly documentRef: Document | null;
}

export const PLATFORM_UTILS_TOKEN = new InjectionToken<PlatformUtils>('PLATFORM_UTILS_TOKEN', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    const documentRef = inject(DOCUMENT);
    const isBrowser = isPlatformBrowser(platformId);
    const isServer = isPlatformServer(platformId);

    const windowRef = isBrowser ? (documentRef?.defaultView ?? null) : null;

    return {
      isBrowser,
      isServer,
      windowRef,
      documentRef: (documentRef as Document) ?? null,
    } as const;
  },
});
