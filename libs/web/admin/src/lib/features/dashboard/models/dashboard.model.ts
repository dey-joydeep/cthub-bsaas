export interface DashboardStats {
  totalCustomers: number;
  totalAppointments: number;
  totalRevenue: number;
  activeSubscriptions: number;
  count: number;
  newCustomers?: number;
  returningCustomers?: number;
  activeCustomers?: number;
  churnedCustomers?: number;
  mrr?: number;
  arr?: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface AppointmentTrend {
  date: string;
  count: number;
}

export interface Renewal {
  id: string;
  customerId: string;
  customerName: string;
  subscriptionId: string;
  serviceName: string;
  renewalDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface ProductSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string | Date;
  soldBy: string;
  customerId?: string;
  customerName?: string;
  invoiceNumber?: string;
}

export interface ProductSalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageSaleValue: number;
  salesByProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface ProductSalesFilter {
  startDate?: string | Date;
  endDate?: string | Date;
  productId?: string;
  soldById?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ProductSalesResponse {
  data: ProductSale[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SubscriptionData {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  month: string;
  retentionRate: number;
}
