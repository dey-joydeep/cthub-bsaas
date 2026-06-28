import { PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-core-platform';
import type { PlatformUtils } from '@cthub-bsaas/web-core-platform';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core-common';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

// Widget Components
import { CustomerStatsWidgetComponent } from './widgets/customer-stats/customer-stats-widget.component';
import { ProductSalesWidgetComponent } from './widgets/product-sales-widget/product-sales-widget.component';
import { RenewalsListWidgetComponent } from './widgets/renewals-list/renewals-list-widget.component';
import { RevenueChartComponent } from './widgets/revenue-chart/revenue-chart.component';
import { StatsWidgetComponent } from './widgets/stats/stats-widget.component';
import { SubscriptionChartWidgetComponent } from './widgets/subscription-chart/subscription-chart-widget.component';

// Services
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe, TranslateDirective,
    StatsWidgetComponent,
    RevenueChartComponent,
    CustomerStatsWidgetComponent,
    ProductSalesWidgetComponent,
    SubscriptionChartWidgetComponent,
    RenewalsListWidgetComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent extends AbstractBaseComponent implements OnInit {
  tenantId: string = 'demo-tenant';
  private isBrowser: boolean;

  breakpoint: number = 1;

  constructor(
    private dashboardService: DashboardService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(PLATFORM_UTILS_TOKEN) private platformUtils: PlatformUtils,
  ) {
    super();
    this.isBrowser = isPlatformBrowser(this.platformId);
    const initialWidth = this.isBrowser && this.platformUtils.windowRef ? this.platformUtils.windowRef.innerWidth : 0;
    this.setBreakpoint(initialWidth);
  }

  private setBreakpoint(width: number): void {
    if (width <= 768) {
      this.breakpoint = 1;
    } else if (width <= 1200) {
      this.breakpoint = 2;
    } else {
      this.breakpoint = 3;
    }
  }

  override async ngOnInit(): Promise<void> {
    super.ngOnInit();
    if (this.isBrowser) {
      try {
        const savedTenantId = await firstValueFrom(this.dashboardService.getTenantId());
        if (savedTenantId) {
          this.tenantId = savedTenantId;
          this.dashboardService.setTenantId(savedTenantId);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Failed to load tenant ID:', errorMessage);
        this.errorService.handleError(error as Error);
      }

      if (this.platformUtils.windowRef) {
        this.setBreakpoint(this.platformUtils.windowRef.innerWidth);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (this.isBrowser && this.platformUtils.windowRef) {
      const target = event.target as Window;
      this.setBreakpoint(target.innerWidth);
    }
  }
}
