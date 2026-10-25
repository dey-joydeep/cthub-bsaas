/**
 * Parameters for filtering dashboard data
 */
export interface DashboardParams {
  /**
   * Start date for filtering data (inclusive)
   * @example '2023-01-01'
   */
  startDate?: Date;

  /**
   * End date for filtering data (inclusive)
   * @example '2023-12-31'
   */
  endDate?: Date;

  /**
   * Maximum number of records to return
   * @default 10
   */
  limit?: number;

  /**
   * Number of records to skip for pagination
   * @default 0
   */
  offset?: number;

  /**
   * Additional filter parameters
   */
  [key: string]: unknown;
}

/**
 * Parameters for product sales reports
 */
export interface ProductSalesParams extends DashboardParams {
  productId?: string;
  soldById?: string;
  customerId?: string;
}

/**
 * Parameters for revenue reports
 */
export interface RevenueParams extends DashboardParams {
  groupBy: 'day' | 'week' | 'month' | 'year';
}
