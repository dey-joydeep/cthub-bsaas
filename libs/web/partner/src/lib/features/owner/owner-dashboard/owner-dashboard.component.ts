import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { BranchProfile } from '../../salon-owner-settings/models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from '../../salon-owner-settings/salon-owner-settings.api';
import { DashboardAlert, OwnerDashboard } from './models/owner-dashboard.models';
import { OwnerDashboardApi } from './owner-dashboard.api';

interface MetricCard {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly icon: string;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `
    <section class="dashboard-shell">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <header class="dashboard-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p>Monitor bookings, revenue, dues, and stock issues for the selected business day.</p>
        </div>
        <div class="quick-actions">
          <a mat-stroked-button routerLink="/owner/pos"><mat-icon>point_of_sale</mat-icon> Checkout</a>
          <a mat-stroked-button routerLink="/owner/inventory"><mat-icon>inventory_2</mat-icon> Inventory</a>
        </div>
      </header>

      @if (error()) {
        <p class="status status-error">{{ error() }}</p>
      }

      <mat-card>
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-bar" (ngSubmit)="loadDashboard()">
            <mat-form-field appearance="outline">
              <mat-label>Branch</mat-label>
              <mat-select formControlName="branchId">
                <mat-option value="">All branches</mat-option>
                @for (branch of branches(); track branch.id) {
                  <mat-option [value]="branch.id">{{ branch.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Business date</mat-label>
              <input matInput type="date" formControlName="date" />
            </mat-form-field>
            <button mat-flat-button type="submit" [disabled]="loading()">Refresh</button>
          </form>
        </mat-card-content>
      </mat-card>

      <div class="metric-grid">
        @for (metric of metrics(); track metric.label) {
          <mat-card>
            <mat-card-content class="metric-card">
              <mat-icon>{{ metric.icon }}</mat-icon>
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.hint }}</small>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div class="dashboard-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Appointment summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-list">
              @for (entry of appointmentEntries(); track entry[0]) {
                <div class="summary-row">
                  <span>{{ entry[0] }}</span>
                  <strong>{{ entry[1] }}</strong>
                </div>
              } @empty {
                <p class="empty">No appointments for this date.</p>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Operational alerts</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="alert-list">
              @for (alert of alerts(); track alert.id) {
                <div class="alert-row" [class.warning]="alert.severity === 'WARNING'">
                  <mat-icon>{{ alert.kind === 'LOW_STOCK' ? 'inventory' : 'payments' }}</mat-icon>
                  <div>
                    <strong>{{ alert.kind }}</strong>
                    <span>{{ alert.message }}</span>
                  </div>
                  @if (alert.amount) {
                    <small>{{ alert.amount }}</small>
                  }
                </div>
              } @empty {
                <p class="empty">No operational alerts for the selected branch.</p>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-shell {
        display: grid;
        gap: 20px;
        padding: 24px;
      }

      .dashboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      h1 {
        margin: 0;
        font-size: 2rem;
      }

      p {
        margin: 6px 0 0;
        color: #52606d;
      }

      .quick-actions,
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .filter-bar mat-form-field {
        min-width: 220px;
      }

      .metric-grid,
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .dashboard-grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }

      .metric-card {
        display: grid;
        gap: 8px;
      }

      .metric-card mat-icon {
        color: #2563eb;
      }

      .metric-card strong {
        font-size: 1.6rem;
      }

      .summary-list,
      .alert-list {
        display: grid;
        gap: 10px;
      }

      .summary-row,
      .alert-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 44px;
        border: 1px solid #d7dde4;
        border-radius: 8px;
        padding: 10px 12px;
      }

      .alert-row {
        justify-content: flex-start;
      }

      .alert-row div {
        display: grid;
        gap: 2px;
      }

      .alert-row small {
        margin-left: auto;
      }

      .warning {
        border-color: #f59e0b;
        background: #fffbeb;
      }

      .status {
        margin: 0;
        border-radius: 8px;
        padding: 10px 12px;
      }

      .status-error {
        background: #fef2f2;
        color: #b91c1c;
      }

      .empty {
        margin: 0;
        color: #697586;
      }

      @media (max-width: 900px) {
        .dashboard-header,
        .quick-actions,
        .filter-bar {
          align-items: stretch;
          flex-direction: column;
        }

        .metric-grid,
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class OwnerDashboardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsApi = inject(SalonOwnerSettingsApi);
  private readonly dashboardApi = inject(OwnerDashboardApi);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly dashboard = signal<OwnerDashboard | null>(null);
  protected readonly alerts = signal<readonly DashboardAlert[]>([]);

  protected readonly filterForm = this.fb.nonNullable.group({
    branchId: [''],
    date: [this.localDateInputValue(), Validators.required],
  });

  constructor() {
    this.loadBranches();
  }

  protected loadDashboard(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const value = this.filterForm.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      dashboard: this.dashboardApi.getOwnerDashboard(value.branchId, value.date),
      alerts: this.dashboardApi.listDashboardAlerts(value.branchId).pipe(
        catchError(() => {
          this.error.set('Dashboard alerts could not be loaded.');
          return of({ items: [], page: { limit: 0, nextCursor: null, hasMore: false } });
        }),
      ),
    }).subscribe({
      next: ({ dashboard, alerts }) => {
        this.dashboard.set(dashboard);
        this.alerts.set(alerts.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Dashboard panels could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected metrics(): readonly MetricCard[] {
    const dashboard = this.dashboard();
    return [
      { label: 'Gross revenue', value: dashboard?.revenue.gross ?? '0.00', hint: 'Finalized invoices', icon: 'trending_up' },
      { label: 'Paid', value: dashboard?.revenue.paid ?? '0.00', hint: 'Captured payments', icon: 'payments' },
      { label: 'Due', value: dashboard?.revenue.due ?? '0.00', hint: 'Open balances', icon: 'receipt_long' },
      { label: 'Low stock', value: String(dashboard?.inventoryAlerts ?? 0), hint: 'Current branch', icon: 'inventory_2' },
    ];
  }

  protected appointmentEntries(): readonly [string, number][] {
    return Object.entries(this.dashboard()?.appointments ?? {});
  }

  private loadBranches(): void {
    this.loading.set(true);
    this.settingsApi.listBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches.items);
        this.filterForm.patchValue({ date: this.localDateInputValue(new Date(), branches.items[0]?.timezone) });
        this.loadDashboard();
      },
      error: () => {
        this.error.set('Dashboard branches could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  private localDateInputValue(date = new Date(), timezone?: string): string {
    const parts = timezone ? this.datePartsInTimezone(date, timezone) : { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    const year = parts.year;
    const month = String(parts.month).padStart(2, '0');
    const day = String(parts.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private datePartsInTimezone(date: Date, timezone: string): { readonly year: number; readonly month: number; readonly day: number } {
    const values = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .reduce<Record<string, number>>((parts, part) => {
        if (part.type !== 'literal') {
          parts[part.type] = Number(part.value);
        }
        return parts;
      }, {});
    return { year: values['year'], month: values['month'], day: values['day'] };
  }
}
