export interface DashboardRevenueModel {
  readonly gross: string;
  readonly paid: string;
  readonly due: string;
}

export interface DashboardModel {
  readonly businessDate: string;
  readonly branchId: string | null;
  readonly appointments: Readonly<Record<string, number>>;
  readonly revenue: DashboardRevenueModel;
  readonly inventoryAlerts: number;
}

export interface DashboardAlertModel {
  readonly id: string;
  readonly kind: 'LOW_STOCK' | 'PENDING_DUE';
  readonly severity: 'INFO' | 'WARNING';
  readonly branchId: string;
  readonly message: string;
  readonly entityId?: string;
  readonly amount?: string;
}
