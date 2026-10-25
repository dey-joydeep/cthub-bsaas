import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppointmentTrend, DashboardStats, ProductSales, Renewal, RevenueData, SubscriptionData } from './models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = '/api';
  private tenantId = 'demo-tenant';
  private readonly http = inject(HttpClient);

  getUpcomingRenewals(): Promise<Renewal[]> {
    return this.http
      .get<Renewal[]>(`${this.apiUrl}/dashboard/renewals?tenantId=${this.tenantId}`)
      .toPromise()
      .then((data) => data || []);
  }

  getStats(): Promise<DashboardStats> {
    return this.http
      .get<DashboardStats>(`${this.apiUrl}/dashboard/stats`)
      .toPromise()
      .then(
        (data) =>
          data ||
          ({
            totalCustomers: 0,
            totalAppointments: 0,
            totalRevenue: 0,
            activeSubscriptions: 0,
            count: 0,
          } as DashboardStats),
      );
  }

  getProductSales(tenantId: string): Promise<ProductSales[]> {
    return this.http
      .get<ProductSales[]>(`${this.apiUrl}/dashboard/product-sales?tenantId=${tenantId}`)
      .toPromise()
      .then((data) => data || []);
  }

  getRevenueData(): Promise<RevenueData[]> {
    return this.http
      .get<RevenueData[]>(`${this.apiUrl}/dashboard/revenue`)
      .toPromise()
      .then((data) => data || [])
      .catch((error) => {
        console.error('Error fetching revenue data:', error);
        return [];
      });
  }

  getSubscriptionData(): Promise<SubscriptionData[]> {
    return this.http
      .get<SubscriptionData[]>(`${this.apiUrl}/dashboard/subscriptions`)
      .toPromise()
      .then((data) => data || [])
      .catch((error) => {
        console.error('Error fetching subscription data:', error);
        return [];
      });
  }

  getRevenueChart(): Observable<RevenueData[]> {
    return this.http.get<{ data: RevenueData[] }>(`${this.apiUrl}/dashboard/revenue/chart`).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('Error fetching revenue chart data:', error);
        return throwError(() => error);
      }),
    );
  }

  getAppointmentTrends(): Observable<AppointmentTrend[]> {
    return this.http.get<{ data: AppointmentTrend[] }>(`${this.apiUrl}/dashboard/appointments/trends`).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('Error fetching appointment trends:', error);
        return throwError(() => error);
      }),
    );
  }

  getTopServices(): Observable<{ name: string; count: number; revenue: number }[]> {
    return this.http
      .get<{ data: { name: string; count: number; revenue: number }[] }>(`${this.apiUrl}/services/top`)
      .pipe(map((response) => response.data));
  }

  getCustomerRetention(): Observable<{ month: string; retentionRate: number }[]> {
    return this.http
      .get<{ data: { month: string; retentionRate: number }[] }>(`${this.apiUrl}/customers/retention`)
      .pipe(map((response) => response.data));
  }

  getTenantId(): Observable<string> {
    return of(this.tenantId);
  }

  setTenantId(value: string | null | undefined): void {
    if (typeof value === 'string' && value.trim().length > 0) {
      this.tenantId = value;
    }
  }
}
