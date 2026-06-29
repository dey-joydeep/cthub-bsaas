import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@cthub-bsaas/web-admin/auth';
import { Inject } from '@angular/core';
import { CURRENT_USER } from '@cthub-bsaas/web-core/auth';
import type { CurrentUserPort, CurrentUserMin } from '@cthub-bsaas/web-core/auth';

type AdminAppUser = CurrentUserMin & {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
};

// Using CurrentUserMin from shared auth port

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'BeautySaaS';
  error: string | null = null;
  // Public properties for template binding
  currentUser: AdminAppUser | null = null;
  isLoggedIn = false;
  pendingApprovalsCount = 0; // Will be populated from a service

  /**
   * Check if the current user has admin role
   */
  get isAdmin(): boolean {
    return (this.currentUser?.role || '') === 'admin';
  }

  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(CURRENT_USER) private currentUserService: CurrentUserPort,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.initializeAuthSubscription();
  }

  private initializeAuthSubscription(): void {
    this.authSubscription = this.currentUserService.currentUser$.subscribe(
      (user: AdminAppUser | null) => {
        this.currentUser = user;
        this.isLoggedIn = !!user;

        if (this.isAdmin) {
          this.loadAdminData();
        }
      },
      (error: unknown) => {
        console.error('Error in user subscription:', error);
        this.showError('Failed to load user data');
        this.isLoggedIn = false;
        this.currentUser = null;
      },
    );
  }

  private loadAdminData(): void {
    // Load admin-specific data here
    this.loadPendingApprovals();
  }

  private loadPendingApprovals(): void {
    // TODO: Implement actual service call to get pending approvals count
    // For now, we'll simulate it
    this.pendingApprovalsCount = 3; // Simulated count
  }

  private showError(message: string): void {
    this.error = message;
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Handle user logout
   */
  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log out';
      this.showError(errorMessage);
      console.error('Logout error:', error);
    }
  }

  /**
   * Navigate to the admin dashboard
   */
  navigateToAdminDashboard(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  /**
   * Navigate to the user's profile
   */
  navigateToProfile(): void {
    if (this.currentUser?.id) {
      this.router.navigate(['/profile', this.currentUser.id]);
    }
  }
}
