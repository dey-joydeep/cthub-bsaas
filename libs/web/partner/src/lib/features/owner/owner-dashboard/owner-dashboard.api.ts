import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ApiEnvelope } from '../../salon-owner-settings/models/salon-owner-settings.models';
import { DashboardAlertPage, OwnerDashboard } from './models/owner-dashboard.models';

@Injectable({ providedIn: 'root' })
export class OwnerDashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/partner/dashboard';

  getOwnerDashboard(branchId: string, date: string): Observable<OwnerDashboard> {
    const params = new HttpParams().set('branchId', branchId).set('date', date);
    return this.http.get<ApiEnvelope<OwnerDashboard>>(`${this.baseUrl}/owner`, { params }).pipe(map((response) => response.data));
  }

  listDashboardAlerts(branchId: string): Observable<DashboardAlertPage> {
    const params = new HttpParams().set('branchId', branchId);
    return this.http.get<ApiEnvelope<DashboardAlertPage>>(`${this.baseUrl}/alerts`, { params }).pipe(map((response) => response.data));
  }
}
