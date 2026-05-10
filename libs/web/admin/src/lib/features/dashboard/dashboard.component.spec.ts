import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { sharedTestProviders } from '../../shared/test-setup';
import { Component } from '@angular/core';

// Stub for the missing chart components
@Component({ selector: 'app-subscription-chart', template: '', standalone: true })
class BsaasSubscriptionChartStub {}

@Component({ selector: 'app-revenue-chart', template: '', standalone: true })
class BsaasRevenueChartStub {}

@Component({ selector: 'app-customer-stats', template: '', standalone: true })
class BsaasCustomerStatsStub {}

@Component({ selector: 'app-renewals-list', template: '', standalone: true })
class BsaasRenewalsListStub {}

@Component({ selector: 'app-product-sales-chart', template: '', standalone: true })
class BsaasProductSalesChartStub {}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, DashboardComponent, TranslateModule.forRoot(), ReactiveFormsModule],
      providers: [provideAnimations(), ...sharedTestProviders],
    })
      .overrideComponent(DashboardComponent, {
        set: {
          imports: [
            CommonModule,
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
