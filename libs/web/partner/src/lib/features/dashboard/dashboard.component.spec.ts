import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { of } from 'rxjs';
import { PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-core-platform';

@Component({ selector: 'app-stats-widget', template: '' })
class StatsWidgetStub {}

@Component({ selector: 'app-subscription-chart', template: '' })
class BsaasSubscriptionChartStub {}

@Component({ selector: 'app-revenue-chart', template: '' })
class BsaasRevenueChartStub {}

@Component({ selector: 'app-customer-stats', template: '' })
class BsaasCustomerStatsStub {}

@Component({ selector: 'app-renewals-list', template: '' })
class BsaasRenewalsListStub {}

@Component({ selector: 'app-product-sales-chart', template: '' })
class BsaasProductSalesChartStub {}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: any;

  beforeEach(async () => {
    const mockDashboardService = {
      getTenantId: vi.fn().mockReturnValue(of('demo-tenant')),
    };

    const mockPlatformUtils = {
      windowRef: {
        innerWidth: 1024,
      },
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideAnimations(),
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: PLATFORM_UTILS_TOKEN, useValue: mockPlatformUtils },
      ],
    })
      .overrideComponent(DashboardComponent, {
        set: {
          imports: [
            CommonModule,
            StatsWidgetStub,
            BsaasSubscriptionChartStub,
            BsaasRevenueChartStub,
            BsaasCustomerStatsStub,
            BsaasRenewalsListStub,
            BsaasProductSalesChartStub,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
