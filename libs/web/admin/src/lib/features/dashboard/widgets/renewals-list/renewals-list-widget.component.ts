import { Component, input, inject, ChangeDetectionStrategy, signal } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { DashboardService } from '../../services/dashboard.service';
import { Subscription } from 'rxjs';

// Define the renewal status type
type RenewalStatus = 'pending' | 'completed' | 'overdue';

// Define the renewal interface
export interface Renewal {
  id?: string;
  salonName: string;
  customerName?: string;
  serviceName?: string;
  renewalDate: string;
  amount?: number;
  status?: RenewalStatus;
}

@Component({
  selector: 'app-renewals-list-widget',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatListModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './renewals-list-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./renewals-list-widget.component.css'],
})
export class RenewalsListWidgetComponent extends AbstractBaseComponent {
  tenantId = input.required<string>();
  title = input('Upcoming Renewals');
  subtitle = input('View all upcoming subscription renewals');

  readonly renewalsSignal = signal<Renewal[]>([]);
  get renewals(): Renewal[] {
    return this.renewalsSignal();
  }
  set renewals(val: Renewal[]) {
    this.renewalsSignal.set(val);
  }
  private subscriptions = new Subscription();
  private readonly dashboardService = inject(DashboardService);

  override ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    super.ngOnDestroy();
  }

  private loadRenewals() {
    if (!this.tenantId()) {
      this.error = $localize`:@@DASHBOARD.RENEWALS.TENANT_REQUIRED:Tenant ID is required.`;
      return;
    }

    this.loading = true;
    this.error = null;

    const sub = this.dashboardService.getRenewals(this.tenantId()).subscribe({
      next: (renewals: Renewal[]) => {
        this.renewals = renewals.map((renewal: Renewal) => ({
          ...renewal,
          status: this.getRenewalStatus(renewal.renewalDate),
          renewalDate: renewal.renewalDate, // Keep as string to match the interface
        }));
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = $localize`:@@DASHBOARD.RENEWALS.ERROR_LOADING:Failed to load renewals.`;
        this.handleError(error);
        this.loading = false;
      },
    });

    this.subscriptions.add(sub);
  }

  public override ngOnInit(): void {
    this.loadRenewals();
  }

  getDaysUntilRenewal(renewalDate: string): number {
    const today = new Date();
    const renewal = new Date(renewalDate);
    return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getRenewalStatus(renewalDate: string): RenewalStatus {
    try {
      const today = new Date();
      const renewal = new Date(renewalDate);

      // Handle invalid date strings
      if (isNaN(renewal.getTime())) {
        console.warn('Invalid renewal date:', renewalDate);
        return 'pending';
      }

      const diffTime = renewal.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'overdue';
      if (diffDays <= 7) return 'pending';
      return 'completed';
    } catch (error) {
      console.error('Error calculating renewal status:', error);
      return 'pending';
    }
  }

  getStatusIcon(status?: RenewalStatus): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'completed':
        return 'check_circle';
      case 'overdue':
        return 'warning';
      default:
        return 'info';
    }
  }

  getRenewalCountByStatus(status: RenewalStatus): number {
    return this.renewals.filter((renewal) => renewal.status === status).length;
  }

  formatRenewalDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatRenewalStatus(status?: 'pending' | 'completed' | 'overdue' | RenewalStatus): string {
    if (!status) return '';
    const statusMap: Record<string, string> = {
      pending: 'DASHBOARD.RENEWALS.STATUS.PENDING',
      completed: 'DASHBOARD.RENEWALS.STATUS.COMPLETED',
      overdue: 'DASHBOARD.RENEWALS.STATUS.OVERDUE',
    };
    return statusMap[status] || '';
  }

  getStatusColor(status?: RenewalStatus): string {
    if (!status) return 'var(--mat-info)';
    const colorMap: Record<string, string> = {
      pending: 'var(--mat-warning)',
      completed: 'var(--mat-success)',
      overdue: 'var(--mat-error)',
    };
    return colorMap[status] || 'var(--mat-info)';
  }
}
