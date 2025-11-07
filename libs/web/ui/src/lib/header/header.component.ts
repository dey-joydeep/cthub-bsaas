import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { PLATFORM_UTILS_TOKEN, type PlatformUtils, StorageService } from '@cthub-bsaas/web-core-platform';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, firstValueFrom, of, timer } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';

// Models
interface Language {
  code: string;
  name: string;
  rtl?: boolean;
}

interface City {
  id: string;
  name: string;
  country?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  icon?: string;
  time?: Date;
  action?: {
    type?: string;
    label?: string;
    url?: string;
    method?: string;
    payload?: any;
    handler?: () => void;
  };
}

// Mock services - these should be replaced with actual service implementations
class CurrentUserService {
  currentUser$ = of<User | null>(null);

  getCurrentUser() {
    return of<User | null>(null);
  }

  clearCurrentUser() {
    return of({});
  }
}

class NotificationService {
  getNotifications() {
    return of<Notification[]>([]);
  }

  getUnreadCount() {
    return of(0);
  }

  markAsRead(_notificationId: string) {
    return of({ success: true });
  }

  markAllAsRead() {
    return of({ success: true });
  }

  // Process notification to ensure it has required properties
  static processNotification(notification: any): Notification {
    return {
      ...notification,
      action: notification.action || {},
    };
  }
}

class AuthService {
  logout() {
    return of({ success: true });
  }
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatBadgeModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    FormsModule,
    TranslateModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: [], // Using inline styles for now
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Services
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private currentUserService = inject(CurrentUserService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private storageService = inject(StorageService);
  private platformUtils = inject<PlatformUtils>(PLATFORM_UTILS_TOKEN);
  private destroy$ = new Subject<void>();
  private isBrowser: boolean = false;

  // State properties
  user: User | null = null;
  isLoggedIn = false;

  // Header visibility and scroll state
  isVisible = true;
  lastScrollPosition = 0;

  // User authentication state
  isAuthenticated = false;
  currentUser: User | null = null;

  // UI state
  isMobile = false;
  isLoading = false;
  isMobileSearchVisible = false;
  showCityPopup = false;
  showNotifications = false;
  showUserMenu = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  searchQuery = '';
  selectedLanguage = 'en';
  selectedCity = '1';

  // Constants
  readonly languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'bn', name: 'বাংলা', rtl: true },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  ];

  readonly cities: City[] = [
    { id: 'mumbai', name: 'Mumbai', country: 'India' },
    { id: 'delhi', name: 'Delhi', country: 'India' },
    { id: 'bangalore', name: 'Bangalore', country: 'India' },
    { id: 'hyderabad', name: 'Hyderabad', country: 'India' },
    { id: 'chennai', name: 'Chennai', country: 'India' },
    { id: 'kolkata', name: 'Kolkata', country: 'India' },
    { id: 'pune', name: 'Pune', country: 'India' },
    { id: 'ahmedabad', name: 'Ahmedabad', country: 'India' },
    { id: 'jaipur', name: 'Jaipur', country: 'India' },
    { id: 'surat', name: 'Surat', country: 'India' },
  ];

  // Private properties
  private subscriptions = new Subscription();

  // Handle window resize
  @HostListener('window:resize')
  onResize() {
    this.checkIfMobile();
  }

  ngOnInit() {
    // Initialize browser-specific code
    if (this.isBrowser) {
      // Check if mobile on init
      this.checkIfMobile();

      // Subscribe to scroll events
      this.platformUtils.windowRef?.addEventListener('scroll', this.handleScroll.bind(this));

      // Subscribe to window resize events
      this.platformUtils.windowRef?.addEventListener('resize', this.onResize);

      // Load initial scroll position
      this.handleScroll();
    }

    // Load user data
    this.loadUserData();

    // Load notifications
    this.loadNotifications();

    // Setup notification polling
    this.setupNotificationPolling();
  }

  ngOnDestroy() {
    // Clean up event listeners
    if (this.isBrowser) {
      this.platformUtils.windowRef?.removeEventListener('scroll', this.handleScroll);
      this.platformUtils.windowRef?.removeEventListener('resize', this.onResize);
    }

    // Unsubscribe from all subscriptions
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle scroll events for header visibility
  @HostListener('window:scroll')
  handleScroll() {
    if (!this.isBrowser) return;

    const currentScrollPosition =
      this.platformUtils.windowRef?.pageYOffset || this.platformUtils.documentRef?.documentElement.scrollTop || 0;

    this.isVisible = currentScrollPosition < this.lastScrollPosition || currentScrollPosition < 10;
    this.lastScrollPosition = currentScrollPosition;
    this.cdr.markForCheck();
  }

  private loadUserData(): void {
    this.subscriptions.add(
      this.currentUserService.getCurrentUser().subscribe({
        next: (user) => {
          this.user = user;
          this.isLoggedIn = !!user;
          this.isAuthenticated = !!user;
          this.currentUser = user;

          if (user) {
            this.loadNotifications();
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.cdr.markForCheck();
        },
      }),
    );

    // Load saved preferences if in browser
    if (this.isBrowser) {
      this.storageService.getItem$<string>('userLanguage').subscribe({
        next: (savedLanguage: string | null) => {
          if (savedLanguage) {
            this.onLanguageChange(savedLanguage);
          }
        },
        error: (error: any) => console.warn('Failed to load language preference:', error),
      });

      this.storageService.getItem$<string>('userCity').subscribe({
        next: (savedCity: string | null) => {
          if (savedCity) {
            this.selectedCity = savedCity;
            this.cdr.markForCheck();
          }
        },
        error: (error: any) => console.warn('Failed to load city preference:', error),
      });
    }
  }

  private checkIfMobile() {
    this.isMobile = this.isBrowser ? (this.platformUtils.windowRef?.innerWidth || 0) < 768 : false;
  }

  private loadNotifications(): void {
    if (!this.isLoggedIn) return;

    this.isLoading = true;
    this.subscriptions.add(
      this.notificationService.getNotifications().subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load notifications', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      }),
    );

    this.subscriptions.add(
      this.notificationService.getUnreadCount().subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      }),
    );
  }

  private setupNotificationPolling(): void {
    // Poll for new notifications every 5 minutes
    timer(0, 5 * 60 * 1000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => (this.isLoggedIn ? this.notificationService.getUnreadCount() : of(0))),
        tap((count) => {
          if (count > this.unreadCount && this.unreadCount > 0) {
            // Show a subtle notification that new notifications are available
            this.snackBar
              .open(
                this.translate.instant('NOTIFICATIONS.NEW_NOTIFICATIONS', { count: count - this.unreadCount }),
                this.translate.instant('COMMON.VIEW'),
                { duration: 5000 },
              )
              .onAction()
              .subscribe(() => {
                this.showNotifications = true;
              });
          }
          this.unreadCount = count;
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error polling notifications', error);
          return of(0);
        }),
      )
      .subscribe();
  }

  onToggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.markAllAsRead();
    }
  }

  onToggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  // Handle language change
  async onLanguageChange(languageCode: string, showSnackbar = true): Promise<void> {
    this.selectedLanguage = languageCode;
    this.translate.use(languageCode);

    // Save preference using storage service
    if (this.isBrowser) {
      try {
        await firstValueFrom(this.storageService.setItem$('userLanguage', languageCode));
      } catch (error) {
        console.warn('Failed to save language preference:', error);
      }
    }

    // Update document direction for RTL languages
    if (this.isBrowser && this.platformUtils.documentRef?.documentElement) {
      const selectedLang = this.languages.find((lang) => lang.code === languageCode);
      this.platformUtils.documentRef.documentElement.dir = selectedLang?.rtl ? 'rtl' : 'ltr';
      this.platformUtils.documentRef.documentElement.lang = languageCode;
    }

    // Show snackbar if requested
    if (showSnackbar) {
      this.snackBar.open(this.translate.instant('LANGUAGE_CHANGED'), this.translate.instant('CLOSE'), { duration: 3000 });
    }

    // Emit event for other components
    if (this.isBrowser) {
      this.platformUtils.documentRef?.dispatchEvent(new CustomEvent('languageChange', { detail: languageCode }));
    }

    this.cdr.markForCheck();
  }

  // Handle city selection change
  async onCityChange(cityId: string): Promise<void> {
    this.selectedCity = cityId;

    // Save preference using storage service
    if (this.isBrowser) {
      try {
        await firstValueFrom(this.storageService.setItem$('userCity', cityId));
      } catch (error) {
        console.warn('Failed to save city preference:', error);
      }
    }

    // Show snackbar
    const selectedCity = this.cities.find((city) => city.id === cityId);
    if (selectedCity) {
      this.snackBar.open(this.translate.instant('CITY_CHANGED', { city: selectedCity.name }), this.translate.instant('CLOSE'), {
        duration: 3000,
      });
    }

    // Close the city popup
    this.showCityPopup = false;
    this.cdr.markForCheck();
  }

  toggleCityPopup(show?: boolean): void {
    this.showCityPopup = show !== undefined ? show : !this.showCityPopup;
  }

  // Handle city confirmation
  confirmCity(cityId?: string): void {
    if (cityId) {
      this.selectedCity = cityId;
      // Save city preference
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('userCity', cityId);
      }
    }
    this.showCityPopup = false;
  }

  // Toggle mobile search
  toggleMobileSearch(show?: boolean): void {
    this.isMobileSearchVisible = show !== undefined ? show : !this.isMobileSearchVisible;
  }

  // Alias for template compatibility
  get logout() {
    return this.onLogout.bind(this);
  }

  onSearch(query?: string): void {
    const searchQuery = query || this.searchQuery;
    if (searchQuery && searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: searchQuery.trim() } });
      this.searchQuery = '';
      this.isMobileSearchVisible = false;
    }
  }

  onClearSearch(): void {
    this.searchQuery = '';
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Notification marked as read, the service will update the count
          if (notification.action?.url) {
            this.router.navigateByUrl(notification.action.url);
          } else if (notification.action?.handler) {
            notification.action.handler();
          }
          this.showNotifications = false;
        },
        error: (error) => {
          console.error('Failed to mark notification as read', error);
        },
      });
    } else if (notification.action?.url) {
      this.router.navigateByUrl(notification.action.url);
      this.showNotifications = false;
    } else if (notification.action?.handler) {
      notification.action.handler();
      this.showNotifications = false;
    }
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // The service will update the notifications and count
        this.snackBar.open(this.translate.instant('NOTIFICATIONS.MARKED_ALL_READ'), this.translate.instant('COMMON.OK'), {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Failed to mark all notifications as read', error);
        this.snackBar.open(this.translate.instant('NOTIFICATIONS.MARK_READ_ERROR'), this.translate.instant('COMMON.CLOSE'), {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  // Handle logout
  onLogout(): void {
    this.isLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.isLoading = false;
        this.snackBar.open(this.translate.instant('AUTH.LOGOUT_ERROR'), this.translate.instant('COMMON.CLOSE'), {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  onProfileClick(): void {
    if (this.user) {
      this.router.navigate(['/profile']);
      this.showUserMenu = false;
    }
  }

  onSettingsClick(): void {
    this.router.navigate(['/settings']);
    this.showUserMenu = false;
  }
}

