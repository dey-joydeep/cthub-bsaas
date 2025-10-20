import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DashboardStats } from './models/customer-stats-widget.model';

@Injectable({ providedIn: 'root' })
export class CustomerStatsWidgetService {
  constructor(private http: HttpClient) {}

  getStats(): Promise<DashboardStats> {
    // Simulate API call
    return Promise.resolve({
      totalCustomers: 1200,
      newCustomers: 50,
      returningCustomers: 1150,
      totalAppointments: 2500,
      totalRevenue: 125000,
      activeSubscriptions: 300,
      count: 0,
    });
  }
}
