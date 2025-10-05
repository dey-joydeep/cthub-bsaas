import type { PlatformUtils } from '@cthub-bsaas/web-config';

/**
 * Creates a mock implementation of PlatformUtils for testing
 * @param overrides Optional overrides for the default mock values
 */
export function createPlatformUtilsMock(overrides: Partial<PlatformUtils> = {}): PlatformUtils {
  const defaultGeolocation = {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    }),
  };

  const mock: PlatformUtils = {
    isBrowser: true,
    isServer: false,
    documentRef: typeof document !== 'undefined' ? document : null,
    windowRef:
      typeof window !== 'undefined'
        ? ({
            ...window,
            navigator: {
              ...((window as any).navigator ?? {}),
              geolocation: defaultGeolocation,
            },
          } as unknown as Window)
        : ({ navigator: { geolocation: defaultGeolocation } } as unknown as Window),
    ...overrides,
  };

  return mock;
}

/**
 * Creates a server-side mock implementation of PlatformUtils
 */
export function createServerPlatformUtilsMock(): PlatformUtils {
  return createPlatformUtilsMock({
    isBrowser: false,
    isServer: true,
    documentRef: null,
    windowRef: null as unknown as Window,
  });
}

/**
 * Creates a browser mock implementation of PlatformUtils
 */
export function createBrowserPlatformUtilsMock(): PlatformUtils {
  return createPlatformUtilsMock({
    isBrowser: true,
    isServer: false,
  });
}
