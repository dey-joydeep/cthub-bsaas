import type { PagedEnvelope } from '../../../salon-owner-settings/models/salon-owner-settings.models';

export interface DashboardRevenue {
  readonly gross: string;
  readonly paid: string;
  readonly due: string;
}

export interface OwnerDashboard {
  readonly businessDate: string;
  readonly branchId: string;
  readonly appointments: Readonly<Record<string, number>>;
  readonly revenue: DashboardRevenue;
  readonly inventoryAlerts: number;
}

export interface DashboardAlert {
  readonly id: string;
  readonly kind: 'LOW_STOCK' | 'PENDING_DUE';
  readonly severity: 'INFO' | 'WARNING';
  readonly branchId: string;
  readonly message: string;
  readonly entityId?: string;
  readonly amount?: string;
}

export type DashboardAlertPage = PagedEnvelope<DashboardAlert>;
