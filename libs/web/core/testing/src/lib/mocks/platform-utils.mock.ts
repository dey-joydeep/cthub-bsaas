export interface PlatformUtils {
  readonly isBrowser: boolean;
  readonly isServer: boolean;
  readonly windowRef: Window | null;
  readonly documentRef: Document | null;
}

/**
 * Creates a mock implementation of PlatformUtils for testing
 * @param overrides Optional overrides for the default mock values
 */
export function createPlatformUtilsMock(overrides: Partial<PlatformUtils> = {}): PlatformUtils {
  const defaultGeolocation = createMockGeolocation();

  const mock: PlatformUtils = {
    isBrowser: true,
    isServer: false,
    documentRef: typeof document !== 'undefined' ? document : null,
    windowRef: createMockWindow(defaultGeolocation),
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
    windowRef: null,
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

function createMockGeolocation(): Geolocation {
  return {
    getCurrentPosition: (success: PositionCallback): void => {
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
    },
    watchPosition: () => 0,
    clearWatch: () => {},
  };
}

function createMockWindow(geolocation: Geolocation): Window {
  if (typeof window === 'undefined') {
    return {
      navigator: { geolocation } as Navigator,
    } as unknown as Window;
  }

  return {
    ...window,
    navigator: {
      ...window.navigator,
      geolocation,
    } as Navigator,
  } as unknown as Window;
}
