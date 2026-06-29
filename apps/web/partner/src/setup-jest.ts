// Import necessary types
import { EventEmitter } from '@angular/core';
import { Observable, of } from 'rxjs';

declare const global: any;

// Extend Jest matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeTrue(): R;
      toBeFalse(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toEqual(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(times: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
}

// Mock for EventEmitter to use in tests
export class MockEventEmitter<T> extends EventEmitter<T> {
  constructor() {
    super();
    // Override emit and subscribe with jest.fn()
    (this as any).emit = jest.fn();
    (this as any).subscribe = jest.fn((next?: any, error?: any, complete?: any) => {
      const subscription = new Observable<T>((subscriber) => {
        if (next) {
          subscriber.next = next;
        }
        if (error) {
          subscriber.error = error;
        }
        if (complete) {
          subscriber.complete = complete;
        }
      }).subscribe(next, error, complete);
      return {
        unsubscribe: () => subscription.unsubscribe(),
        closed: false,
        add: () => {},
        remove: () => {},
      };
    });
  }
}

// Add custom matchers
const customMatchers = {
  toBeTrue(received: any) {
    const pass = received === true;
    return {
      message: () => `expected ${received} to be true`,
      pass,
    };
  },
  toBeFalse(received: any) {
    const pass = received === false;
    return {
      message: () => `expected ${received} to be false`,
      pass,
    };
  },
};

// Extend expect with custom matchers
expect.extend(customMatchers);

// Mock global objects
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance'],
  }),
});

// Mock for HTML template elements
Object.defineProperty(HTMLTemplateElement.prototype, 'content', {
  get() {
    return this.ownerDocument.createDocumentFragment();
  },
});

// Mock browser globals for SSR
const mockWindow = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0,
  },
  navigator: {
    userAgent: 'Jest',
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
  },
  location: {
    href: 'http://localhost/',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost',
  },
  document: {
    documentElement: {
      style: {},
    },
    createElement: jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn(),
      style: {},
    })),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestAnimationFrame: (callback: FrameRequestCallback) => {
    return setTimeout(callback, 0);
  },
  cancelAnimationFrame: (id: number) => {
    clearTimeout(id);
  },
  matchMedia: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  scrollTo: jest.fn(),
  setTimeout: jest.fn((fn) => {
    const id = setTimeout(fn, 0);
    return id;
  }),
  clearTimeout: jest.fn((id) => clearTimeout(id)),
  setInterval: jest.fn((fn) => {
    const id = setInterval(fn, 0);
    return id;
  }),
  clearInterval: jest.fn((id) => clearInterval(id)),
};

// Set up global mocks
global.window = Object.assign({}, global.window, mockWindow);
global.document = Object.assign({}, global.document, mockWindow.document);
global.localStorage = mockWindow.localStorage;
global.sessionStorage = mockWindow.sessionStorage;
global.navigator = mockWindow.navigator;
global.location = mockWindow.location;

// Note: PlatformUtils is provided via app-level providers in specs; no module mocking here.

// Mock for TranslateService
export class MockTranslateService {
  get = jest.fn().mockReturnValue(of('translated text'));
  instant = jest.fn().mockReturnValue('translated text');
  use = jest.fn().mockReturnValue(of({}));
  setDefaultLang = jest.fn();
  getBrowserLang = jest.fn().mockReturnValue('en');
  getLangs = jest.fn().mockReturnValue(['en', 'es']);
  onLangChange = new MockEventEmitter<any>();
  onTranslationChange = new MockEventEmitter<any>();
  onDefaultLangChange = new MockEventEmitter<any>();
}

// Mock for Router
export class MockRouter {
  navigate = jest.fn();
  navigateByUrl = jest.fn();
  events = new MockEventEmitter<any>();
  createUrlTree = jest.fn();
  serializeUrl = jest.fn();
}

// Helper function to create an observable
function createObservable<T>(value: T): Observable<T> {
  return of(value);
}

// Mock for ActivatedRoute
export class MockActivatedRoute {
  snapshot = {
    url: [],
    params: {},
    queryParams: {},
    fragment: null,
    data: {},
    outlet: '',
    component: null,
    routeConfig: null,
    root: null,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    paramMap: new Map(),
    queryParamMap: new Map(),
    toString(): string {
      return '';
    },
  };

  params = createObservable({});
  queryParams = createObservable({});
  fragment = createObservable(null);
  data = createObservable({});
  url = createObservable([]);
  outlet = null;
  component = null;
  routeConfig = null;
  root = null;
  parent = null;
  firstChild = null;
  children = [];
  pathFromRoot = [];
  paramMap = createObservable(new Map());
  queryParamMap = createObservable(new Map());

  toString(): string {
    return '';
  }
}

// Global test mocks
global.jest = global.jest || {};
