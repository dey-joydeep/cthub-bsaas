import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ApiEnvelope } from '../../salon-owner-settings/models/salon-owner-settings.models';
import { DashboardAlertPage, OwnerDashboard } from './models/owner-dashboard.models';

@Injectable({ providedIn: 'root' })
export class OwnerDashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/partner/dashboard';

  getOwnerDashboard(branchId: string | undefined, date: string): Observable<OwnerDashboard> {
    let params = new HttpParams().set('date', date);
    if (branchId) {
      params = params.set('branchId', branchId);
    }
    return this.http.get<ApiEnvelope<OwnerDashboard>>(`${this.baseUrl}/owner`, { params }).pipe(map((response) => response.data));
  }

  listDashboardAlerts(branchId?: string): Observable<DashboardAlertPage> {
    const params = branchId ? new HttpParams().set('branchId', branchId) : undefined;
    return this.http.get<ApiEnvelope<DashboardAlertPage>>(`${this.baseUrl}/alerts`, { params }).pipe(map((response) => response.data));
  }
}
