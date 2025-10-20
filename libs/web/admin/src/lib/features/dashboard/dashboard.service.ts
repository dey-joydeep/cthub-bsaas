import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardComponent } from './dashboard.component';
import { AppointmentTrend, DashboardStats, ProductSales, Renewal, RevenueData, SubscriptionData } from './models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl;
  private tenantId = DashboardComponent.tenantId;

  constructor(private http: HttpClient) {}

  getUpcomingRenewals(): Promise<Renewal[]> {
    return this.http
      .get<Renewal[]>(`${environment.apiUrl}/dashboard/renewals?tenantId=${this.tenantId}`)
      .toPromise()
      .then((data) => data || []);
  }

  getStats(): Promise<DashboardStats> {
    return this.http
      .get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`)
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
      .get<ProductSales[]>(`${environment.apiUrl}/dashboard/product-sales?tenantId=${tenantId}`)
      .toPromise()
      .then((data) => data || []);
  }

  getRevenueData(): Promise<RevenueData[]> {
    return this.http
      .get<RevenueData[]>(`${environment.apiUrl}/dashboard/revenue`)
      .toPromise()
      .then((data) => data || [])
      .catch((error) => {
        console.error('Error fetching revenue data:', error);
        return [];
      });
  }

  getSubscriptionData(): Promise<SubscriptionData[]> {
    return this.http
      .get<SubscriptionData[]>(`${environment.apiUrl}/dashboard/subscriptions`)
      .toPromise()
      .then((data) => data || [])
      .catch((error) => {
        console.error('Error fetching subscription data:', error);
        return [];
      });
  }

  getRevenueChart(): Observable<RevenueData[]> {
    return this.http.get<{ data: RevenueData[] }>(`${environment.apiUrl}/dashboard/revenue/chart`).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('Error fetching revenue chart data:', error);
        return throwError(() => error);
      }),
    );
  }

  getAppointmentTrends(): Observable<AppointmentTrend[]> {
    return this.http.get<{ data: AppointmentTrend[] }>(`${environment.apiUrl}/dashboard/appointments/trends`).pipe(
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
}
