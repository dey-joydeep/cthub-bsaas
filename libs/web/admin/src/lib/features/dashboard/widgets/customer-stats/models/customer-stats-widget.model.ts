export interface DashboardStats {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  totalAppointments: number;
  totalRevenue: number;
  activeSubscriptions: number;
  count: number;
  activeCustomers?: number;
  churnedCustomers?: number;
  mrr?: number;
  arr?: number;
}
