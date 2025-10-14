import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core/http';
import { ErrorService } from '@cthub-bsaas/web-core/http';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CustomerStatsWidgetService } from './customer-stats-widget.service';
import { DashboardStats } from './models/customer-stats-widget.model';

@Component({
  selector: 'app-customer-stats-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, TranslateModule],
  templateUrl: './customer-stats-widget.component.html',
  styleUrls: ['./customer-stats-widget.component.scss'],
})
export class CustomerStatsWidgetComponent extends AbstractBaseComponent {
  stats: DashboardStats = {
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    count: 0,
    newCustomers: 0,
    returningCustomers: 0,
  };

  private statsSubscription?: Subscription;

  constructor(
    @Inject(ErrorService) protected override errorService: ErrorService,
    private customerStatsWidgetService: CustomerStatsWidgetService,
  ) {
    super(errorService);
  }

  public override ngOnInit(): void {
    super.ngOnInit();
    this.loadStats();
  }

  public override ngOnDestroy(): void {
    this.statsSubscription?.unsubscribe();
    super.ngOnDestroy();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.customerStatsWidgetService
      .getStats()
      .then((stats) => {
        this.stats = { ...this.stats, ...stats };
        this.loading = false;
      })
      .catch((error) => {
        this.error = 'Failed to load customer statistics. Please try again later.';
        this.loading = false;
        console.error('Error loading customer stats:', error);
      });
  }

  refresh(): void {
    this.loadStats();
  }
}