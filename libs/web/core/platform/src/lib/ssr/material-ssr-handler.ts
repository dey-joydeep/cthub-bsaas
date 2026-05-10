import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID, Provider, inject } from '@angular/core';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

type SsrProcess = {
  env: Record<string, string | undefined>;
  nextTick: (callback: () => void) => void;
};

type SsrStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  length: number;
};

type SsrCanvasElement = HTMLElement & {
  getContext: () => CanvasRenderingContext2D;
  toDataURL: () => string;
};

type SsrDocument = {
  body: HTMLElement;
  addEventListener: EventTarget['addEventListener'];
  removeEventListener: EventTarget['removeEventListener'];
  createElement: (tagName: string) => HTMLElement;
};

type SsrPerformance = {
  now: () => number;
  timeOrigin: number;
  timing: Record<string, number>;
  memory: Record<string, number>;
  navigation: Record<string, number>;
};

type SsrWindow = {
  document: SsrDocument;
  addEventListener: Window['addEventListener'];
  removeEventListener: Window['removeEventListener'];
  performance: SsrPerformance;
  matchMedia: Window['matchMedia'];
  requestAnimationFrame: Window['requestAnimationFrame'];
  cancelAnimationFrame: Window['cancelAnimationFrame'];
  localStorage: SsrStorage;
  sessionStorage: SsrStorage;
  navigator: Navigator;
  location: Location;
  CSS: typeof CSS;
  HTMLElement: typeof HTMLElement;
  Element: typeof Element;
  Node: typeof Node;
};

type SsrGlobal = {
  process?: SsrProcess;
  window?: SsrWindow;
  document?: SsrDocument;
  navigator?: Navigator;
  localStorage?: SsrStorage;
  sessionStorage?: SsrStorage;
  HTMLElement?: typeof HTMLElement;
  Element?: typeof Element;
  Node?: typeof Node;
  getComputedStyle?: Window['getComputedStyle'];
  requestAnimationFrame?: Window['requestAnimationFrame'];
  cancelAnimationFrame?: Window['cancelAnimationFrame'];
};

const ssrGlobal = globalThis as unknown as SsrGlobal;
const noop = (): void => {};

/**
 * Installs the minimal browser globals required by Angular Material during server rendering.
 *
 * @public
 */
export class MaterialSsrHandler {
  private static initialized = false;

  constructor(private readonly platformId: object) {}

  /**
   * Initializes browser-like globals only in server runtime.
   *
   * @returns {void} Nothing.
   * @public
   */
  initialize(): void {
    if (MaterialSsrHandler.initialized || !isPlatformServer(this.platformId)) {
      return;
    }

    ssrGlobal.process ??= {
      env: {},
      nextTick: (callback: () => void) => {
        setTimeout(callback, 0);
      },
    };

    ssrGlobal.window ??= createSsrWindow();
    ssrGlobal.document ??= ssrGlobal.window.document;
    ssrGlobal.navigator ??= ssrGlobal.window.navigator;
    ssrGlobal.localStorage ??= ssrGlobal.window.localStorage;
    ssrGlobal.sessionStorage ??= ssrGlobal.window.sessionStorage;
    ssrGlobal.HTMLElement ??= ssrGlobal.window.HTMLElement;
    ssrGlobal.Element ??= ssrGlobal.window.Element;
    ssrGlobal.Node ??= ssrGlobal.window.Node;

    installWindowEventGuards(ssrGlobal.window);
    ssrGlobal.window.addEventListener('scroll', noop);
    ssrGlobal.window.addEventListener('resize', noop);
    ssrGlobal.window.addEventListener('orientationchange', noop);

    installNavigatorDefaults(ssrGlobal.navigator);
    MaterialSsrHandler.setupGetComputedStyle();
    MaterialSsrHandler.setupAnimationFrame();
    MaterialSsrHandler.setupCanvasElement(ssrGlobal.window.document);

    MaterialSsrHandler.initialized = true;
  }

  private static setupGetComputedStyle(): void {
    ssrGlobal.getComputedStyle ??= () =>
      ({
        getPropertyValue: () => '',
        setProperty: noop,
      }) as unknown as CSSStyleDeclaration;
  }

  private static setupAnimationFrame(): void {
    ssrGlobal.requestAnimationFrame ??= (callback: FrameRequestCallback): number => {
      const handle = setTimeout(() => callback(Date.now()), 0);
      return Number(handle);
    };

    ssrGlobal.cancelAnimationFrame ??= (id: number): void => {
      clearTimeout(id);
    };
  }

  private static setupCanvasElement(documentRef: SsrDocument): void {
    const originalCreateElement = documentRef.createElement.bind(documentRef);

    documentRef.createElement = (tagName: string): HTMLElement => {
      const element = originalCreateElement(tagName);

      if (tagName.toLowerCase() === 'canvas') {
        const canvasElement = element as SsrCanvasElement;
        canvasElement.getContext = createCanvasContext;
        canvasElement.toDataURL = () => 'data:image/png;base64,';
      }

      return element;
    };
  }
}

/**
 * Creates and initializes the Material SSR compatibility handler.
 *
 * @param {object} platformId - Angular platform identifier.
 * @returns {MaterialSsrHandler} Initialized handler.
 * @public
 */
export function materialSsrHandlerFactory(platformId: object): MaterialSsrHandler {
  const handler = new MaterialSsrHandler(platformId);
  handler.initialize();
  return handler;
}

/**
 * Provides the Material SSR compatibility handler through Angular DI.
 *
 * @returns {Provider} Angular provider.
 * @public
 */
export function provideMaterialSsrHandler(): Provider {
  return {
    provide: MaterialSsrHandler,
    useFactory: () => {
      const handler = materialSsrHandlerFactory(inject(PLATFORM_ID));
      handler.initialize();
      return handler;
    },
  };
}

function createSsrWindow(): SsrWindow {
  return {
    document: createSsrDocument(),
    addEventListener: noop,
    removeEventListener: noop,
    performance: createSsrPerformance(),
    matchMedia: createMatchMedia,
    requestAnimationFrame: (callback: FrameRequestCallback): number => {
      const handle = setTimeout(() => callback(Date.now()), 0);
      return Number(handle);
    },
    cancelAnimationFrame: (id: number): void => {
      clearTimeout(id);
    },
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    navigator: { userAgent: USER_AGENT } as Navigator,
    location: {
      protocol: 'http:',
      host: 'localhost:4200',
    } as Location,
    CSS: {
      escape: (value: string): string => value,
    } as typeof CSS,
    HTMLElement: class SsrHTMLElement {} as unknown as typeof HTMLElement,
    Element: class SsrElement {} as unknown as typeof Element,
    Node: class SsrNode {} as unknown as typeof Node,
  };
}

function createSsrDocument(): SsrDocument {
  return {
    body: {} as HTMLElement,
    addEventListener: noop,
    removeEventListener: noop,
    createElement: (): HTMLElement =>
      ({
        setAttribute: noop,
        style: {},
        getContext: createCanvasContext,
        toDataURL: () => '',
      }) as unknown as HTMLElement,
  };
}

function createSsrPerformance(): SsrPerformance {
  const now = Date.now();

  return {
    now: () => Date.now(),
    timeOrigin: now,
    timing: {
      navigationStart: now,
      connectStart: 0,
      connectEnd: 0,
      requestStart: 0,
      responseStart: 0,
      responseEnd: 0,
      domLoading: 0,
      domInteractive: 0,
      domContentLoadedEventStart: 0,
      domContentLoadedEventEnd: 0,
      domComplete: 0,
      loadEventStart: 0,
      loadEventEnd: 0,
    },
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    },
    navigation: {
      type: 0,
      redirectCount: 0,
    },
  };
}

function createMemoryStorage(): SsrStorage {
  return {
    getItem: () => null,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    key: () => null,
    length: 0,
  };
}

function createMatchMedia(): MediaQueryList {
  return {
    matches: false,
    media: '',
    onchange: null,
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => true,
  };
}

function createCanvasContext(): CanvasRenderingContext2D {
  return {
    fillRect: noop,
    clearRect: noop,
    putImageData: noop,
    getImageData: () => ({}),
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    stroke: noop,
    fill: noop,
    drawImage: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
  } as unknown as CanvasRenderingContext2D;
}

function installNavigatorDefaults(navigatorRef: Navigator): void {
  if (!navigatorRef.userAgent) {
    Object.defineProperty(navigatorRef, 'userAgent', {
      configurable: true,
      value: USER_AGENT,
    });
  }
}

function installWindowEventGuards(windowRef: SsrWindow): void {
  const originalAddEventListener = windowRef.addEventListener.bind(windowRef);
  const originalRemoveEventListener = windowRef.removeEventListener.bind(windowRef);

  windowRef.addEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void => {
    if (type === 'beforeunload' || type === 'unload') {
      return;
    }

    originalAddEventListener(type, listener, options);
  };

  windowRef.removeEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void => {
    if (type === 'beforeunload' || type === 'unload') {
      return;
    }

    originalRemoveEventListener(type, listener, options);
  };
}
