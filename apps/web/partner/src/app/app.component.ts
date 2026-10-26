import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@cthub-bsaas/web-partner/auth';
import { CurrentUserService, type BaseAuthUser } from '@cthub-bsaas/web-core/auth';
import { Subscription } from 'rxjs';

export interface User extends BaseAuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
}

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
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private currentUserService = inject(CurrentUserService);
  private snackBar = inject(MatSnackBar);

  title = 'BeautySaaS';
  error: string | null = null;
  // Public properties for template binding
  currentUser: User | null = null;
  isLoggedIn = false;
  pendingApprovalsCount = 0;

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.roles?.includes('admin') || false;
  }

  get settingsRoute(): string {
    return this.hasRole('staff') && !this.hasRole('owner') ? '/owner/branches' : '/settings';
  }

  private authSubscription?: Subscription;

  ngOnInit(): void {
    this.initializeAuthSubscription();
  }

  private initializeAuthSubscription(): void {
    this.authSubscription = this.currentUserService.currentUser$.subscribe({
      next: (user: BaseAuthUser | null) => {
        this.currentUser = user as User | null;
        this.isLoggedIn = !!user;

        if (this.isAdmin) {
          this.loadPendingApprovals();
        }
      },
      error: () => {
        this.error = 'Failed to load user information';
        this.showNotification('Failed to load user information', 'error');
      },
    });
  }

  private loadPendingApprovals(): void {
    // In real app, call service to get count
    // For now, mock data
    this.pendingApprovalsCount = 3;
  }

  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.currentUser = null;
      this.isLoggedIn = false;
      this.showNotification('Logged out successfully', 'success');
      this.router.navigate(['/login']);
    } catch {
      this.showNotification('Error logging out', 'error');
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`notification-${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Navigation helpers for template
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  navigateToProfile(): void {
    if (this.currentUser) {
      this.router.navigate(['/profile', this.currentUser.id]);
    }
  }

  private hasRole(role: string): boolean {
    const normalizedRole = role.toLowerCase();
    const directRole = (this.currentUser as { role?: string } | null)?.role;
    const roles: readonly string[] = (this.currentUser as { roles?: readonly string[] } | null)?.roles ?? (directRole ? [directRole] : []);

    return roles.some((value) => value.toLowerCase() === normalizedRole) || directRole?.toLowerCase() === normalizedRole;
  }
}
