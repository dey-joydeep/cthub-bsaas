import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { StorageService } from '@cthub-bsaas/web-core-platform';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { AUTH_STATE_PORT, type AuthStatePort, type BaseAuthUser } from '../ports/auth-state.port';

const USER_STORAGE_KEY = 'current_user';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<BaseAuthUser | null>(null);
  private destroy$ = new Subject<void>();

  // Store the URL to redirect to after login
  public redirectUrl: string | null = null;

  // Public observable of the current user
  public currentUser$ = this.currentUserSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => {
      if (prev === null && curr === null) return true;
      if (prev === null || curr === null) return false;
      return prev.id === curr.id;
    }),
    shareReplay(1),
  );

  // Public observable of the current user's ID
  public currentUserId$ = this.currentUser$.pipe(
    map((user) => user?.id || null),
    distinctUntilChanged(),
  );

  // Role helpers are app-specific and not part of core BaseAuthUser

  // Public observable of the current user's authentication status
  public isAuthenticated$ = this.currentUser$.pipe(
    map((user) => !!user),
    distinctUntilChanged(),
  );

  constructor(
    private storage: StorageService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(AUTH_STATE_PORT) private authState: AuthStatePort,
  ) {
    // Only run in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Load user from storage on init
      this.loadUserFromStorage();

      // Prefer app-provided current user stream if available
      if (this.authState.currentUser$) {
        this.authState.currentUser$
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (user: BaseAuthUser | null) => {
              this.currentUserSubject.next(user);
              if (user) {
                this.storage.setItem$(USER_STORAGE_KEY, user).subscribe({
                  error: (error) => console.error('Error saving user to storage:', error),
                });
              } else {
                this.storage.removeItem$(USER_STORAGE_KEY).subscribe({
                  error: (error) => console.error('Error removing user from storage:', error),
                });
              }
            },
            error: (error: unknown) => console.error('Error in currentUser$ stream:', error),
          });
      } else {
        // Fallback: if authenticated and getCurrentUser available, hydrate once
        Promise.resolve(this.authState.isAuthenticated())
          .then((authed) => {
            if (authed && this.authState.getCurrentUser) {
              return this.authState.getCurrentUser();
            }
            return null;
          })
          .then((user) => {
            if (user) {
              this.currentUserSubject.next(user);
              this.storage.setItem$(USER_STORAGE_KEY, user).subscribe({
                error: (error) => console.error('Error saving user to storage:', error),
              });
            }
          })
          .catch((error) => console.error('Error hydrating current user:', error));
      }

      // Set up authentication state subscription
      this.setupAuthState();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get the current user synchronously
   */
  get currentUser(): BaseAuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get the current user ID synchronously
   */
  get currentUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Update the current user
   * @param user The updated user object
   */
  updateUser(user: Partial<BaseAuthUser>): void {
    if (!this.currentUser) {
      console.warn('Cannot update user: no user is currently logged in');
      return;
    }

    const updatedUser = { ...this.currentUser, ...user } as BaseAuthUser;
    this.currentUserSubject.next(updatedUser);
    // Use setItem$ which returns an Observable and handle subscription
    this.storage.setItem$(USER_STORAGE_KEY, updatedUser).subscribe({
      error: (error) => console.error('Error saving user to storage:', error),
    });
  }

  /**
   * Clear the current user (on logout)
   */
  clearUser(): void {
    this.currentUserSubject.next(null);
    // Use removeItem$ which returns an Observable and handle subscription
    this.storage.removeItem$(USER_STORAGE_KEY).subscribe({
      error: (error) => console.error('Error removing user from storage:', error),
    });
  }

  /**
   * Refresh the current user from the server
   */
  refreshUser(): void {
    // This would typically make an API call to get the latest user data
    // For now, we'll just reload from storage
    this.loadUserFromStorage();
  }

  // Private methods

  /**
   * Set up authentication state subscription
   */
  private setupAuthState(): void {
    // Initial check
    this.checkAuthState();

    // Set up polling for auth state changes
    const POLLING_INTERVAL = 30000; // 30 seconds

    // Use timer to create a polling interval
    timer(0, POLLING_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.checkAuthState(),
        error: (error: unknown) => {
          console.error('Error in auth state polling:', error);
          this.clearUser();
        },
      });
  }

  /**
   * Check the current authentication state and update the user accordingly
   */
  private async checkAuthState(): Promise<void> {
    try {
      const isAuthenticated = await this.authState.isAuthenticated();
      if (!isAuthenticated) {
        this.clearUser();
      } else if (!this.currentUser) {
        // If authenticated but no user data, prefer port accessors then storage
        if (this.authState.getCurrentUser) {
          const user = await this.authState.getCurrentUser();
          if (user) {
            this.currentUserSubject.next(user);
            this.storage.setItem$(USER_STORAGE_KEY, user).subscribe({
              error: (error) => console.error('Error saving user to storage:', error),
            });
            return;
          }
        }
        this.loadUserFromStorage();
      }
    } catch (error) {
      console.error('Error checking authentication state:', error);
      this.clearUser();
    }
  }

  /**
   * Load the current user from storage
   */
  private loadUserFromStorage(): void {
    this.storage
      .getItem$<BaseAuthUser>(USER_STORAGE_KEY)
      .pipe(
        filter((user: BaseAuthUser | null): user is BaseAuthUser => user !== null),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (user: BaseAuthUser) => {
          if (user) {
            this.currentUserSubject.next(user);
          }
        },
        error: (error: unknown) => {
          console.error('Failed to load user from storage:', error);
          this.clearUser();
        },
      });
  }
}
