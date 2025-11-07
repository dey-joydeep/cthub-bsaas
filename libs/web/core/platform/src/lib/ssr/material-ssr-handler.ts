import { PLATFORM_ID, inject, Provider } from '@angular/core';
import { isPlatformServer } from '@angular/common';

type Immediate = any; // Using any as a workaround for NodeJS.Immediate

declare const global: typeof globalThis & {
  setImmediate?: (callback: () => void) => any;
  process?: {
    env?: Record<string, string | undefined>;
    nextTick?: (callback: () => void) => void;
  };
  [key: string]: any;
};

const getGlobal = (): typeof global => {
  if (typeof globalThis !== 'undefined') return globalThis as unknown as typeof global;
  if (typeof global !== 'undefined') return global;
  if (typeof window !== 'undefined') return window as unknown as typeof global;
  if (typeof self !== 'undefined') return self as unknown as typeof global;
  return {} as typeof global;
};

const _global = getGlobal();

const _setImmediate = (callback: () => void): any => {
  if (typeof _global.setImmediate === 'function') {
    return _global.setImmediate(callback);
  }
  return setTimeout(callback, 0);
};

export class MaterialSsrHandler {
  private static initialized = false;

  constructor(private readonly platformId: object) {}

  private static isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
  }

  initialize(): void {
    if (MaterialSsrHandler.initialized || !isPlatformServer(this.platformId)) {
      return;
    }

    const globalAny = _global as any;

    if (!globalAny.process) {
      globalAny.process = {
        env: {},
        nextTick: (callback: () => void) => {
          _setImmediate(callback);
        },
      };
    }

    if (typeof globalAny.window === 'undefined') {
      globalAny.window = {
        document: {
          body: {},
          addEventListener: (): void => {},
          removeEventListener: (): void => {},
          createElement: (): HTMLElement =>
            ({
              setAttribute: (): void => {},
              style: {},
              getContext: () => ({}),
              toDataURL: () => '',
            }) as unknown as HTMLElement,
        },
        addEventListener: (): void => {},
        removeEventListener: (): void => {},
        performance: {
          now: () => Date.now(),
          timeOrigin: Date.now(),
          timing: {
            navigationStart: Date.now(),
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
        },
        matchMedia: (): any => ({
          matches: false,
          addListener: (): void => {},
          removeListener: (): void => {},
        }),
        requestAnimationFrame: (callback: FrameRequestCallback): number => {
          const now = performance.now();
          const id = setTimeout(() => callback(now), 0);
          return id as unknown as number;
        },
        cancelAnimationFrame: (id: number): void => {
          clearTimeout(id);
        },
        localStorage: {
          getItem: (): null => null,
          setItem: (): void => {},
          removeItem: (): void => {},
          clear: (): void => {},
          key: (): null => null,
          length: 0,
        },
        sessionStorage: {
          getItem: (): null => null,
          setItem: (): void => {},
          removeItem: (): void => {},
          clear: (): void => {},
          key: (): null => null,
          length: 0,
        },
        navigator: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        location: {
          protocol: 'http:',
          host: 'localhost:4200',
        },
        CSS: {
          escape: (val: string): string => val,
        },
        HTMLElement: class {},
        Element: class {},
        Node: class {},
      };

      if (typeof globalAny.document === 'undefined') {
        globalAny.document = globalAny.window.document;
      }

      if (typeof globalAny.navigator === 'undefined') {
        globalAny.navigator = globalAny.window.navigator;
      }

      if (typeof globalAny.localStorage === 'undefined') {
        globalAny.localStorage = globalAny.window.localStorage;
      }

      if (typeof globalAny.sessionStorage === 'undefined') {
        globalAny.sessionStorage = globalAny.window.sessionStorage;
      }

      if (typeof globalAny.HTMLElement === 'undefined') {
        globalAny.HTMLElement = globalAny.window.HTMLElement;
      }

      const noop = (): void => {};

      const originalAddEventListener = globalAny.window.addEventListener;
      const originalRemoveEventListener = globalAny.window.removeEventListener;

      globalAny.window.addEventListener = (type: string, listener: () => void, options?: boolean | AddEventListenerOptions): void => {
        if (type === 'beforeunload' || type === 'unload') {
          noop();
          return;
        }
        originalAddEventListener.call(globalAny.window, type, listener, options);
      };

      globalAny.window.removeEventListener = (
        type: string,
        listener: () => void,
        options?: boolean | EventListenerOptions,
      ): void => {
        if (type === 'beforeunload' || type === 'unload') {
          noop();
          return;
        }
        originalRemoveEventListener.call(globalAny.window, type, listener, options);
      };

      globalAny.window.addEventListener('scroll', noop);
      globalAny.window.addEventListener('resize', noop);
      globalAny.window.addEventListener('orientationchange', noop);
    }

    if (MaterialSsrHandler.isDefined(globalAny.navigator)) {
      globalAny.navigator.userAgent =
        globalAny.navigator.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    MaterialSsrHandler.setupGetComputedStyle();
    MaterialSsrHandler.setupAnimationFrame();

    const doc = globalAny.window?.document;
    if (MaterialSsrHandler.isDefined(doc)) {
      const originalCreateElement = doc.createElement;
      doc.createElement = (tagName: string): HTMLElement => {
        const element = originalCreateElement.call(doc, tagName);
        if (tagName.toLowerCase() === 'canvas') {
          (element as any).getContext = (): any => ({
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
          });
          (element as any).toDataURL = (): string => 'data:image/png;base64,';
        }
        return element;
      };
    }

    MaterialSsrHandler.initialized = true;
  }

  private static setupGetComputedStyle(): void {
    if (typeof _global.getComputedStyle === 'undefined') {
      _global.getComputedStyle = (): CSSStyleDeclaration =>
        ({
          getPropertyValue: () => '',
          setProperty: (): void => {},
        }) as unknown as CSSStyleDeclaration;
    }
  }

  private static setupAnimationFrame(): void {
    if (typeof _global.requestAnimationFrame === 'undefined') {
      _global.requestAnimationFrame = (callback: FrameRequestCallback): Immediate => _setImmediate(() => callback(Date.now()));
    }

    if (typeof _global.cancelAnimationFrame === 'undefined') {
      _global.cancelAnimationFrame = (id: Immediate): void => {
        clearTimeout(id);
      };
    }
  }
}

export function materialSsrHandlerFactory(platformId: object): MaterialSsrHandler {
  const handler = new MaterialSsrHandler(platformId);
  handler.initialize();
  return handler;
}

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
