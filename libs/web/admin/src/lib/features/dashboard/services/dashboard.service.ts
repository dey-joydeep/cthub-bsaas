import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@env/environment';
import { DashboardStats, ProductSale, ProductSalesFilter, ProductSalesResponse, ProductSalesSummary } from '../models/dashboard.model';
import { AppointmentsFilter, AppointmentsOverview, AppointmentsPageableResponse, Appointment } from '../models/appointment.model';
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard statistics
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Get appointments overview with statistics
   * @param filters Optional filters for appointments
   */
  getAppointmentsOverview(filters?: AppointmentsFilter): Observable<AppointmentsOverview> {
    let params = new HttpParams();

    // Add filter parameters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<AppointmentsOverview>(`${environment.apiUrl}/appointments/overview`, { params });
  }

  /**
   * Get paginated list of appointments
   * @param filters Filters for appointments
   */
  getAppointments(filters?: AppointmentsFilter): Observable<AppointmentsPageableResponse> {
    let params = new HttpParams().set('page', filters?.page?.toString() || '1').set('pageSize', filters?.pageSize?.toString() || '10');

    // Add filter parameters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && !['page', 'pageSize'].includes(key)) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<AppointmentsPageableResponse>(`${environment.apiUrl}/appointments`, { params });
  }

  /**
   * Get appointment by ID
   * @param id Appointment ID
   */
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${environment.apiUrl}/appointments/${id}`);
  }

  /**
   * Update appointment status
   * @param id Appointment ID
   * @param status New status
   */
  updateAppointmentStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${environment.apiUrl}/appointments/${id}/status`, { status });
  }

  /**
   * Get product sales with pagination and filtering
   */
  getProductSales(filters?: ProductSalesFilter): Observable<ProductSalesResponse> {
    let params = new HttpParams();

    // Add pagination parameters
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    // Add sorting parameters
    if (filters?.sortField) {
      params = params.set('sortBy', filters.sortField);
    }
    if (filters?.sortDirection) {
      params = params.set('sortOrder', filters.sortDirection.toUpperCase());
    }

    // Add filter parameters
    if (filters?.startDate) {
      const startDate = filters.startDate instanceof Date ? filters.startDate.toISOString() : filters.startDate;
      params = params.set('startDate', startDate);
    }
    if (filters?.endDate) {
      const endDate = filters.endDate instanceof Date ? filters.endDate.toISOString() : filters.endDate;
      params = params.set('endDate', endDate);
    }
    if (filters?.productId) {
      params = params.set('productId', filters.productId);
    }
    if (filters?.soldById) {
      params = params.set('soldById', filters.soldById);
    }
    if (filters?.customerId) {
      params = params.set('customerId', filters.customerId);
    }

    return this.http.get<ProductSalesResponse>(`${this.apiUrl}/product-sales`, { params }).pipe(
      map((response) => ({
        ...response,
        data: response.data.map((sale) => ({
          ...sale,
          saleDate: new Date(sale.saleDate as string),
        })),
      })),
    );
  }

  /**
   * Get product sales summary with optional date range
   */
  getProductSalesSummary(filters?: { startDate?: string; endDate?: string }): Observable<ProductSalesSummary> {
    let params = new HttpParams();

    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<ProductSalesSummary>(`${this.apiUrl}/product-sales/summary`, { params });
  }

  /**
   * Get top selling products
   */
  getTopSellingProducts(
    limit: number = 5,
  ): Observable<Array<{ productId: string; productName: string; quantity: number; revenue: number }>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Array<{ productId: string; productName: string; quantity: number; revenue: number }>>(
      `${this.apiUrl}/products/top-selling`,
      { params },
    );
  }

  /**
   * Get upcoming subscription renewals for a tenant
   * @param tenantId ID of the tenant
   */
  getRenewals(tenantId: string): Observable<
    Array<{
      id?: string;
      salonName: string;
      customerName?: string;
      serviceName?: string;
      renewalDate: string;
      amount?: number;
      status?: 'pending' | 'completed' | 'overdue';
    }>
  > {
    // For now, return an empty array as a placeholder
    // TODO: Implement actual API call when backend is ready
    return this.http.get<
      Array<{
        id?: string;
        salonName: string;
        customerName?: string;
        serviceName?: string;
        renewalDate: string;
        amount?: number;
        status?: 'pending' | 'completed' | 'overdue';
      }>
    >(`${this.apiUrl}/renewals`, {
      params: { tenantId },
    });
  }
}
