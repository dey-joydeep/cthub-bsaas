import { Component, Input, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core/http';
import { ErrorService } from '@cthub-bsaas/web-core/http';
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
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './renewals-list-widget.component.html',
  styleUrls: ['./renewals-list-widget.component.scss'],
})
export class RenewalsListWidgetComponent extends AbstractBaseComponent {
  @Input() tenantId!: string;
  @Input() title = 'Upcoming Renewals';
  @Input() subtitle = 'View all upcoming subscription renewals';

  renewals: Renewal[] = [];
  private subscriptions = new Subscription();

  constructor(
    @Inject(ErrorService) protected override errorService: ErrorService,
    @Inject(DashboardService) private dashboardService: DashboardService,
  ) {
    super(errorService);
  }

  override ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    super.ngOnDestroy();
  }

  override handleError(error: any): void {
    super.handleError(error);
  }

  private loadRenewals() {
    if (!this.tenantId) {
      this.error = 'Tenant ID is required';
      return;
    }

    this.loading = true;
    this.error = null;

    const sub = this.dashboardService.getRenewals(this.tenantId).subscribe({
      next: (renewals: Renewal[]) => {
        this.renewals = renewals.map((renewal: Renewal) => ({
          ...renewal,
          status: this.getRenewalStatus(renewal.renewalDate),
          renewalDate: renewal.renewalDate, // Keep as string to match the interface
        }));
        this.loading = false;
      },
      error: (error: unknown) => {
        this.error = error instanceof Error ? error.message : 'Failed to load renewals';
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

  getStatusIcon(status: RenewalStatus): string {
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

  formatRenewalStatus(status: 'pending' | 'completed' | 'overdue'): string {
    const statusMap = {
      pending: 'DASHBOARD.RENEWALS.STATUS.PENDING',
      completed: 'DASHBOARD.RENEWALS.STATUS.COMPLETED',
      overdue: 'DASHBOARD.RENEWALS.STATUS.OVERDUE',
    };
    return statusMap[status];
  }

  getStatusColor(status: 'pending' | 'completed' | 'overdue'): string {
    const colorMap = {
      pending: 'var(--mat-warning)',
      completed: 'var(--mat-success)',
      overdue: 'var(--mat-error)',
    };
    return colorMap[status];
  }
}
