import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@cthub-bsaas/web-partner/auth';
import { CURRENT_USER, CurrentUserService, type BaseAuthUser } from '@cthub-bsaas/web-core-auth';
import { hasManagerCapability } from '@cthub-bsaas/shared';
import { Subscription } from 'rxjs';

export interface User extends BaseAuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
  managedBranchIds?: string[];
  canManageBranches?: boolean;
  [key: string]: unknown;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly currentUserService = inject<CurrentUserService>(CURRENT_USER);
  private readonly snackBar = inject(MatSnackBar);

  title = 'BeautySaaS';
  error: string | null = null;
  currentUser: User | null = null;
  isLoggedIn = false;
  pendingApprovalsCount = 0;

  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  get canManageBranches(): boolean {
    return hasManagerCapability(this.currentUser);
  }

  get settingsRoute(): string | null {
    if (this.hasRole('owner') || this.isAdmin) {
      return '/settings';
    }
    if (this.hasRole('staff') && this.canManageBranches) {
      return '/owner/branches';
    }
    return null;
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
        this.isLoggedIn = false;
        this.currentUser = null;
      },
    });
  }

  private loadPendingApprovals(): void {
    this.pendingApprovalsCount = 3;
  }

  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.currentUser = null;
      this.isLoggedIn = false;
      this.showNotification('Logged out successfully', 'success');
      this.router.navigate(['/auth/login']);
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

  navigateToAdminDashboard(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  navigateToSettings(): void {
    if (this.settingsRoute) {
      this.router.navigate([this.settingsRoute]);
    }
  }

  navigateToProfile(): void {
    if (this.currentUser?.id) {
      this.router.navigate(['/profile', this.currentUser.id]);
    }
  }

  private hasRole(role: string): boolean {
    const target = role.toLowerCase();
    const current = this.currentUser;
    if (!current) return false;
    if (typeof current.role === 'string' && current.role.toLowerCase() === target) return true;
    if (Array.isArray(current.roles)) {
      return current.roles.some((r) => typeof r === 'string' && r.toLowerCase() === target);
    }
    return false;
  }
}
