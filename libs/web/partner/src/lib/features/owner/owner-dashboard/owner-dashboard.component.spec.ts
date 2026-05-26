import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SalonOwnerSettingsApi } from '../../salon-owner-settings/salon-owner-settings.api';
import { OwnerDashboardApi } from './owner-dashboard.api';
import { OwnerDashboardComponent } from './owner-dashboard.component';

describe('OwnerDashboardComponent', () => {
  let fixture: ComponentFixture<OwnerDashboardComponent>;
  const settingsApi = {
    listBranches: jest.fn(),
  };
  const dashboardApi = {
    getOwnerDashboard: jest.fn(),
    listDashboardAlerts: jest.fn(),
  };

  beforeEach(async () => {
    settingsApi.listBranches.mockReturnValue(
      of({
        items: [{ id: 'branch-1', businessId: 'business-1', name: 'Main', timezone: 'Asia/Tokyo', currency: 'JPY', address: {}, createdAt: '', updatedAt: '' }],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );
    dashboardApi.getOwnerDashboard.mockReturnValue(
      of({
        businessDate: '2026-05-26',
        branchId: 'branch-1',
        appointments: { BOOKED: 2, WALK_IN: 1 },
        revenue: { gross: '90.00', paid: '60.00', due: '30.00' },
        inventoryAlerts: 1,
      }),
    );
    dashboardApi.listDashboardAlerts.mockReturnValue(
      of({
        items: [
          {
            id: 'low-stock:branch-1:product-1',
            kind: 'LOW_STOCK',
            severity: 'WARNING',
            branchId: 'branch-1',
            message: 'Shampoo is at or below reorder point.',
            entityId: 'product-1',
          },
        ],
        page: { limit: 1, nextCursor: null, hasMore: false },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, OwnerDashboardComponent],
      providers: [
        { provide: SalonOwnerSettingsApi, useValue: settingsApi },
        { provide: OwnerDashboardApi, useValue: dashboardApi },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
  });

  it('loads branch-scoped dashboard panels', () => {
    expect(settingsApi.listBranches).toHaveBeenCalled();
    expect(dashboardApi.getOwnerDashboard).toHaveBeenCalledWith('branch-1', expect.any(String));
    expect(dashboardApi.listDashboardAlerts).toHaveBeenCalledWith('branch-1');
    expect(fixture.nativeElement.textContent).toContain('Owner Dashboard');
    expect(fixture.nativeElement.textContent).toContain('90.00');
  });

  it('refreshes dashboard with the selected filters', () => {
    const component = fixture.componentInstance as unknown as {
      filterForm: { patchValue: (value: Record<string, string>) => void };
      loadDashboard: () => void;
    };
    component.filterForm.patchValue({ branchId: 'branch-1', date: '2026-05-27' });
    component.loadDashboard();

    expect(dashboardApi.getOwnerDashboard).toHaveBeenLastCalledWith('branch-1', '2026-05-27');
  });
});
