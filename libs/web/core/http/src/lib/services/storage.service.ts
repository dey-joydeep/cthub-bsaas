/**
 * Storage Service
 *
 * Provides a consistent API for storage operations with SSR support
 * and memory fallback when localStorage is not available.
 */
import { isPlatformBrowser } from '@angular/common';
import { Injectable, Optional, PLATFORM_ID, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PLATFORM_UTILS_TOKEN, PlatformUtils } from '@cthub-bsaas/web-config';

type StorageType = 'local' | 'session' | 'memory';
type Serializable = string | number | boolean | Record<string, unknown> | Serializable[] | null;

/**
 * Service for handling storage operations in an SSR-compatible way
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
 private storage: Storage | null = null;
  private readonly platformUtils: PlatformUtils | null;
  private readonly isBrowser: boolean;
  private readonly memoryStore = new Map<string, string>();
  private initialized = false;
  private storageType: StorageType = 'memory';

  constructor() {
    this.platformUtils = inject(PLATFORM_UTILS_TOKEN, { optional: true });
    const platformId = inject(PLATFORM_ID);
    this.isBrowser = isPlatformBrowser(platformId);

    try {
      this.initialize();
    } catch (error) {
      console.warn('Error initializing StorageService:', error);
      this.storage = this.createMemoryStorage();
      this.storageType = 'memory';
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Initialize storage with SSR safety
   */
  private initialize(): void {
    if (this.storage !== null) return;

    try {
      if (this.isBrowser && this.platformUtils) {
        // Use platform utils' windowRef if available
        this.storage = this.platformUtils.windowRef?.localStorage ?? null;
        this.storageType = this.storage ? 'local' : 'memory';
      } else if (this.isBrowser && typeof window !== 'undefined') {
        // Fallback to direct window access
        this.storage = window.localStorage;
        this.storageType = 'local';
      } else {
        // Fallback to memory storage
        this.storage = this.createMemoryStorage();
        this.storageType = 'memory';
      }
    } catch (error) {
      console.warn('Failed to initialize storage, falling back to memory:', error);
      this.storage = this.createMemoryStorage();
      this.storageType = 'memory';
    }
  }

  /**
   * Create an in-memory storage implementation
   */
  private createMemoryStorage(): Storage {
    const map = this.memoryStore;

    return {
      get length(): number {
        return map.size;
      },
      clear(): void {
        map.clear();
      },
      getItem(key: string): string | null {
        return map.get(key) ?? null;
      },
      key(index: number): string | null {
        return Array.from(map.keys())[index] ?? null;
      },
      removeItem(key: string): void {
        map.delete(key);
      },
      setItem(key: string, value: string): void {
        map.set(key, value);
      },
    };
  }

  /**
   * Get an item from storage
   * @param key The key to get
   * @param defaultValue The default value if the key doesn't exist
   */
  getItem<T extends Serializable>(key: string, defaultValue: T | null = null): T | null {
    if (!this.initialized) {
      console.warn('StorageService not yet initialized');
      return defaultValue;
    }

    try {
      const item = this.storage?.getItem(key) ?? null;
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get an item from storage as an observable
   * @param key The key to get
   * @param defaultValue The default value if the key doesn't exist
   */
  getItem$<T extends Serializable>(key: string, defaultValue: T | null = null): Observable<T | null> {
    return of(this.getItem(key, defaultValue));
  }

  /**
   * Set an item in storage
   * @param key The key to set
   * @param value The value to set
   */
  setItem<T extends Serializable>(key: string, value: T): void {
    if (!this.initialized) {
      console.warn('StorageService not yet initialized');
      return;
    }

    try {
      const stringValue = JSON.stringify(value);
      this.storage?.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }

  /**
   * Set an item in storage as an observable
   * @param key The key to set
   * @param value The value to set
   */
  setItem$<T extends Serializable>(key: string, value: T): Observable<void> {
    return new Observable((subscriber) => {
      try {
        this.setItem(key, value);
        subscriber.next();
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  /**
   * Remove an item from storage
   * @param key The key to remove
   */
  removeItem(key: string): void {
    if (!this.initialized) {
      console.warn('StorageService not yet initialized');
      return;
    }

    try {
      this.storage?.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }

  /**
   * Remove an item from storage as an observable
   * @param key The key to remove
   */
  removeItem$(key: string): Observable<void> {
    return new Observable((subscriber) => {
      try {
        this.removeItem(key);
        subscriber.next();
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    if (!this.initialized) {
      console.warn('StorageService not yet initialized');
      return;
    }

    try {
      this.storage?.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Clear all items from storage as an observable
   */
  clear$(): Observable<void> {
    return new Observable((subscriber) => {
      try {
        this.clear();
        subscriber.next();
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  /**
   * Get the type of storage being used
   */
  getStorageType(): StorageType {
    return this.storageType;
  }
}



