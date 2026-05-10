import 'jest-preset-angular/setup-jest';
import { jest } from '@jest/globals';

// Extend the existing MediaQueryList interface to include deprecated methods
declare global {
  interface MediaQueryList {
    /** @deprecated */
    addListener: (callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) => void;
    /** @deprecated */
    removeListener: (callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) => void;
  }

  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    // Deprecated methods
    addListener: jest.fn(),
    removeListener: jest.fn(),
    // Standard methods
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn((event: Event) => true),
  }),
});

// Set default test timeout
jest.setTimeout(10000);
