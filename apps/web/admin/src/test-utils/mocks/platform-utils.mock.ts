import type { PlatformUtils } from '@cthub-bsaas/web-config';

/**
 * Creates a mock implementation of PlatformUtils for testing
 * @param overrides Optional overrides for the default mock values
 */
export function createPlatformUtilsMock(overrides: Partial<PlatformUtils> = {}): PlatformUtils {
  const position: GeolocationPosition = {
    coords: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 1,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: (): unknown => ({}),
    },
    timestamp: Date.now(),
    toJSON: (): unknown => ({}),
  };

  const defaultGeolocation: Geolocation = {
    getCurrentPosition: jest.fn((success: PositionCallback): void => {
      success(position);
    }),
    watchPosition: jest.fn((_success: PositionCallback): number => 1),
    clearWatch: jest.fn((_watchId: number): void => undefined),
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
              ...(window.navigator ?? {}),
              geolocation: defaultGeolocation,
            } as Navigator,
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
